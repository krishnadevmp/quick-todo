import { apiFetch } from './client';
import type { FilterState, Task } from '@/types';

// ── Tasks API ─────────────────────────────────────────────────────────────
// One function per endpoint in ../../../quick-todo-service/docs/API.md.
// Field shapes match `Task` exactly — no translation layer needed.

export function list(filter?: Partial<FilterState>): Promise<Task[]> {
  return apiFetch('/tasks', {
    query: {
      priority: filter?.priority,
      category: filter?.category,
      tags: filter?.tags?.length ? filter.tags.join(',') : undefined,
      search: filter?.search || undefined,
      sortBy: filter?.sortBy,
      sortDir: filter?.sortDir,
    },
  });
}

export function today(): Promise<Task[]> {
  return apiFetch('/tasks/today');
}

export function upcoming(days = 7): Promise<{ overdue: Task[]; upcoming: Task[] }> {
  return apiFetch('/tasks/upcoming', { query: { days } });
}

export function stats(): Promise<Record<string, unknown>> {
  return apiFetch('/tasks/stats');
}

export function getById(id: string): Promise<Task> {
  return apiFetch(`/tasks/${id}`);
}

type TaskCreateBody = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export function create(body: TaskCreateBody): Promise<Task> {
  return apiFetch('/tasks', { method: 'POST', body });
}

export function update(id: string, changes: Partial<Task>): Promise<Task> {
  return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: changes });
}

export function updateSeries(id: string, changes: Partial<Task>): Promise<void> {
  return apiFetch(`/tasks/${id}/series`, { method: 'PATCH', body: changes });
}

export function complete(id: string): Promise<{ task: Task; nextTask?: Task }> {
  return apiFetch(`/tasks/${id}/complete`, { method: 'POST' });
}

export function stopRecurring(id: string): Promise<void> {
  return apiFetch(`/tasks/${id}/stop-recurring`, { method: 'POST' });
}

export function remove(id: string): Promise<void> {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}

export function clearCompleted(): Promise<{ count: number }> {
  return apiFetch('/tasks/completed', { method: 'DELETE' });
}

/** Bulk upsert — preserves each item's `id` when it already belongs to this
 *  user. Used both for the Settings "Import JSON" flow and, deliberately,
 *  by the sync engine as its single push path for task creates/updates
 *  (see src/sync/syncEngine.ts) since it never mints a new server-side id. */
export function importTasks(items: (Partial<Task> & { title: string })[]): Promise<{ count: number }> {
  return apiFetch('/tasks/import', { method: 'POST', body: items });
}

/** Convenience wrapper around importTasks for a single task — the sync
 *  engine's upsert path. */
export function importOne(task: Task): Promise<{ count: number }> {
  return importTasks([task]);
}
