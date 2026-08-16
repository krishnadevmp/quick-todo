import { QuickTodoDB } from '@/db/schema';
import * as tasksApi from '@/api/tasks.api';
import * as expensesApi from '@/api/expenses.api';
import { pullFromServer } from './syncEngine';

// ── Guest -> account import ──────────────────────────────────────────────
// Reads from the guest-scoped database directly (independent of whichever
// scope is currently active) so this works whether it's called right after
// signup/login (scope has already switched to the new account) or not.

function guestDB(): QuickTodoDB {
  return new QuickTodoDB('guest');
}

export interface GuestDataSummary {
  tasks: number;
  expenses: number;
}

/** Returns null if there's nothing to offer importing. */
export async function hasGuestData(): Promise<GuestDataSummary | null> {
  const db = guestDB();
  const [tasks, expenses] = await Promise.all([db.tasks.count(), db.expenses.count()]);
  if (tasks === 0 && expenses === 0) return null;
  return { tasks, expenses };
}

/**
 * Pushes every guest-scoped task/expense up to the now-authenticated
 * account, then pulls the account's data back down so the active (now
 * account-scoped) Dexie database ends up with the canonical server copies.
 * The guest database itself is left untouched either way.
 */
export async function importGuestData(): Promise<GuestDataSummary> {
  const db = guestDB();
  const [tasks, expenses] = await Promise.all([db.tasks.toArray(), db.expenses.toArray()]);

  if (tasks.length > 0) {
    // Preserves each task's local id — see syncEngine.ts's note on why
    // /tasks/import (not POST /tasks) is used for every task write.
    await tasksApi.importTasks(tasks);
  }
  for (const expense of expenses) {
    // No bulk/import endpoint for expenses — ids aren't preserved, which is
    // fine since they're never user-visible.
    await expensesApi.create(expense);
  }

  await pullFromServer();

  return { tasks: tasks.length, expenses: expenses.length };
}
