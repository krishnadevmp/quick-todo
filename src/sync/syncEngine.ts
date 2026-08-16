import { getDB, type SyncQueueItem } from '@/db/schema';
import * as outbox from './outbox';
import { TaskRepository } from '@/db/taskRepository';
import { ExpenseRepository } from '@/db/expenseRepository';
import * as tasksApi from '@/api/tasks.api';
import * as expensesApi from '@/api/expenses.api';
import * as settingsApi from '@/api/settings.api';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/components/ui/Toast';

// ── Local-first sync engine ──────────────────────────────────────────────
// Dexie is always written first (instant, offline-capable); this module is
// what eventually reconciles that with the server once online + signed in.
// See PLAN §6 for the full design rationale.

const GRACE_MS = 15_000; // don't delete a just-created local row during a pull race
const PULL_INTERVAL_MS = 2 * 60 * 1000;

let autoSyncStarted = false;
let pullInFlight: Promise<void> | null = null;
let lastPulledAt: number | null = null;

function isAccountMode(): boolean {
  const { mode, token } = useAuthStore.getState();
  return mode === 'account' && !!token;
}

// ── Push ──────────────────────────────────────────────────────────────────

async function pushOne(item: SyncQueueItem): Promise<'ok' | 'retry' | 'drop'> {
  try {
    if (item.entity === 'task') {
      if (item.op === 'delete') {
        await tasksApi.remove(item.entityId);
      } else {
        const task = await TaskRepository.getById(item.entityId);
        if (!task) return 'drop'; // deleted locally again before this ever synced
        // Deliberately /tasks/import, not POST /tasks — import preserves the
        // client-generated id (POST would mint a different server id and
        // silently desync every future update/delete for this task).
        await tasksApi.importOne(task);
      }
    } else if (item.entity === 'expense') {
      if (item.op === 'delete') {
        await expensesApi.remove(item.entityId);
      } else {
        const expense = await ExpenseRepository.getById(item.entityId);
        if (!expense) return 'drop';
        try {
          const updated = await expensesApi.update(item.entityId, expense);
          useExpenseStore.setState((s) => ({
            expenses: s.expenses.map((e) => (e.id === updated.id ? updated : e)),
          }));
        } catch (e) {
          if (!(e instanceof ApiError) || e.status !== 404) throw e;
          // Never created server-side yet (expenses have no import/upsert
          // endpoint, unlike tasks) — create it, then re-key the local row
          // from its client-generated id to the server-assigned one.
          const created = await expensesApi.create(expense);
          await ExpenseRepository.rekey(expense.id, created);
          useExpenseStore.setState((s) => ({
            expenses: s.expenses
              .map((e) => (e.id === expense.id ? created : e))
              .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
          }));
        }
      }
    } else {
      await settingsApi.updateSettings(useSettingsStore.getState());
    }
    return 'ok';
  } catch (e) {
    // Network failure (status 0) or 5xx — worth retrying later.
    // 4xx (validation, not found, etc.) — not retryable, drop it.
    if (e instanceof ApiError && e.status !== 0 && e.status < 500) return 'drop';
    return 'retry';
  }
}

export async function flushOutbox(): Promise<void> {
  if (!isAccountMode()) return;
  const items = await outbox.all();
  for (const item of items) {
    const result = await pushOne(item);
    if (result === 'retry') break; // leave this + everything after it queued
    await outbox.remove(item.id);
    if (result === 'drop') toast.error("Couldn't sync a change — it was skipped.");
  }
}

// ── Pull ──────────────────────────────────────────────────────────────────

export async function pullFromServer(): Promise<void> {
  if (!isAccountMode()) return;
  if (pullInFlight) return pullInFlight;

  pullInFlight = (async () => {
    try {
      const [remoteTasks, remoteExpenses, remoteSettings] = await Promise.all([
        tasksApi.list(),
        expensesApi.list(),
        settingsApi.getSettings(),
      ]);

      const db = getDB();
      const pending = await outbox.all();
      const pendingTaskIds = new Set(pending.filter((i) => i.entity === 'task').map((i) => i.entityId));
      const pendingExpenseIds = new Set(pending.filter((i) => i.entity === 'expense').map((i) => i.entityId));
      const now = Date.now();

      // Tasks: upsert remote (unless a local unsynced edit is pending),
      // remove local rows the server no longer has.
      const localTasks = await db.tasks.toArray();
      const remoteTaskIds = new Set(remoteTasks.map((t) => t.id));
      for (const remote of remoteTasks) {
        if (pendingTaskIds.has(remote.id)) continue;
        const local = localTasks.find((t) => t.id === remote.id);
        if (!local || local.updatedAt <= remote.updatedAt) await db.tasks.put(remote);
      }
      for (const local of localTasks) {
        if (remoteTaskIds.has(local.id) || pendingTaskIds.has(local.id)) continue;
        if (now - new Date(local.createdAt).getTime() < GRACE_MS) continue;
        await db.tasks.delete(local.id);
      }

      // Expenses — same policy.
      const localExpenses = await db.expenses.toArray();
      const remoteExpenseIds = new Set(remoteExpenses.map((e) => e.id));
      for (const remote of remoteExpenses) {
        if (pendingExpenseIds.has(remote.id)) continue;
        const local = localExpenses.find((e) => e.id === remote.id);
        if (!local || local.updatedAt <= remote.updatedAt) await db.expenses.put(remote);
      }
      for (const local of localExpenses) {
        if (remoteExpenseIds.has(local.id) || pendingExpenseIds.has(local.id)) continue;
        if (now - new Date(local.createdAt).getTime() < GRACE_MS) continue;
        await db.expenses.delete(local.id);
      }

      // Settings: single row, server is authoritative.
      useSettingsStore.setState(remoteSettings);

      lastPulledAt = Date.now();
    } catch (e) {
      // Offline / server error — keep whatever's already cached locally.
      if (!(e instanceof ApiError)) console.error('[sync] pull failed', e);
    } finally {
      pullInFlight = null;
    }
  })();

  return pullInFlight;
}

// ── Orchestration ────────────────────────────────────────────────────────

export function getLastPulledAt(): number | null {
  return lastPulledAt;
}

export async function pendingCount(): Promise<number> {
  return outbox.count();
}

/** Manual "Sync now" — used by the Account page. */
export async function syncNow(): Promise<void> {
  await flushOutbox();
  await pullFromServer();
}

/** Call once at app boot. Safe to call repeatedly — only wires up once. */
export function startAutoSync(): void {
  if (autoSyncStarted) return;
  autoSyncStarted = true;

  window.addEventListener('online', () => {
    if (isAccountMode()) void syncNow();
  });

  setInterval(() => {
    if (isAccountMode() && navigator.onLine) void pullFromServer();
  }, PULL_INTERVAL_MS);
}
