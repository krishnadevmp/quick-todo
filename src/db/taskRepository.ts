import { db } from './schema';
import type { Task, FilterState } from '@/types';
import { generateId } from '@/utils/generateId';

// ── TaskRepository ─────────────────────────────────────────────────────────
// All task persistence goes through this module.
// The UI layer never imports `db` directly — it only calls these functions.
// This boundary makes it easy to swap Dexie for a Supabase adapter later.

export const TaskRepository = {
  // ── Read ────────────────────────────────────────────────────────────────

  async getAll(): Promise<Task[]> {
    return db.tasks.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  /** Tasks due today (YYYY-MM-DD) that aren't done */
  async getToday(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    return db.tasks
      .where('dueDate')
      .equals(today)
      .filter((t) => t.status !== 'done')
      .sortBy('createdAt');
  },

  /** Tasks due in the next N days (default 7), excluding today, not done */
  async getUpcoming(days = 7): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    const todayStr = today.toISOString().slice(0, 10);
    const limitStr = limit.toISOString().slice(0, 10);

    return db.tasks
      .where('dueDate')
      .between(todayStr, limitStr, false, true) // exclusive start (not today)
      .filter((t) => t.status !== 'done')
      .sortBy('dueDate');
  },

  /** Filtered query used by the "All" view */
  async getFiltered(filter: FilterState): Promise<Task[]> {
    let collection = db.tasks.orderBy('createdAt').reverse();

    if (filter.priority) {
      collection = collection.filter((t) => t.priority === filter.priority);
    }
    if (filter.category) {
      collection = collection.filter((t) => t.category === filter.category);
    }
    if (filter.tags.length > 0) {
      collection = collection.filter((t) =>
        filter.tags.every((tag) => t.tags.includes(tag))
      );
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      collection = collection.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
      );
    }

    return collection.toArray();
  },

  // ── Write ───────────────────────────────────────────────────────────────

  async create(partial: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      ...partial,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.add(task);
    return task;
  },

  async update(id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
    await db.tasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async complete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.tasks.update(id, {
      status: 'done',
      completedAt: now,
      updatedAt: now,
    });
  },

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  // ── Bulk / recurring ────────────────────────────────────────────────────

  async bulkCreate(tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Task[]> {
    const now = new Date().toISOString();
    const full = tasks.map((t) => ({ ...t, id: generateId(), createdAt: now, updatedAt: now }));
    await db.tasks.bulkAdd(full);
    return full;
  },

  /** All tasks that belong to a recurring series */
  async getByRecurringParent(parentId: string): Promise<Task[]> {
    return db.tasks.where('recurringParentId').equals(parentId).toArray();
  },

  // ── Stats (for dashboard) ────────────────────────────────────────────────

  async getStats() {
    const all = await db.tasks.toArray();
    const done = all.filter((t) => t.status === 'done');
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = all.filter((t) => t.dueDate === today);
    const overdue = all.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
    );

    return {
      total: all.length,
      completed: done.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      completionRate: all.length ? Math.round((done.length / all.length) * 100) : 0,
    };
  },
};
