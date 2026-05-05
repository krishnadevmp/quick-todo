import { db } from './schema';
import type { Task, FilterState, RecurringPattern } from '@/types';
import { generateId } from '@/utils/generateId';
import { getNextOccurrence } from '@/utils/recurringUtils';

/** Fields that are shared across all tasks in a series (not per-occurrence) */
type SeriesChanges = Partial<Omit<Task, 'id' | 'createdAt' | 'dueDate' | 'status' | 'completedAt' | 'recurringParentId'>>;

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

  /** Tasks past their due date that are not done */
  async getOverdue(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    return db.tasks
      .where('dueDate')
      .below(today)
      .filter((t) => t.status !== 'done')
      .sortBy('dueDate');
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

  /** Filtered + sorted query used by the "All" view */
  async getFiltered(filter: FilterState): Promise<Task[]> {
    // Base collection — always ordered by createdAt desc as default
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

    const results = await collection.toArray();

    // Apply sort in-memory (Dexie can only sort by indexed field as primary order)
    const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

    results.sort((a, b) => {
      let cmp = 0;
      if (filter.sortBy === 'priority') {
        cmp = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      } else if (filter.sortBy === 'dueDate') {
        const ad = a.dueDate ?? '9999-99-99';
        const bd = b.dueDate ?? '9999-99-99';
        cmp = ad < bd ? -1 : ad > bd ? 1 : 0;
      } else {
        // createdAt
        cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
      }
      return filter.sortDir === 'asc' ? cmp : -cmp;
    });

    return results;
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

  /**
   * Mark a task done.  If the task has a recurring pattern, automatically
   * creates the next occurrence and returns it.
   */
  async complete(id: string): Promise<{ nextTask?: Task }> {
    const task = await db.tasks.get(id);
    if (!task) return {};

    const now = new Date().toISOString();
    await db.tasks.update(id, { status: 'done', completedAt: now, updatedAt: now });

    if (task.recurring === 'none') return {};

    // Spawn the next occurrence
    const nextDueDate = getNextOccurrence(task.dueDate, task.recurring as RecurringPattern);
    const parentId    = task.recurringParentId ?? task.id;

    const nextTask = await TaskRepository.create({
      title:             task.title,
      description:       task.description,
      priority:          task.priority,
      category:          task.category,
      status:            'todo',
      dueDate:           nextDueDate,
      dueTime:           task.dueTime,
      reminderOffset:    task.reminderOffset,
      recurring:         task.recurring,
      tags:              [...task.tags],
      recurringParentId: parentId,
    });

    return { nextTask };
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

  /**
   * Update metadata on every pending (non-done) task in a recurring series.
   * dueDate is intentionally excluded — each occurrence keeps its own date.
   */
  async updateSeries(id: string, changes: SeriesChanges): Promise<void> {
    const task = await db.tasks.get(id);
    if (!task) return;

    const now      = new Date().toISOString();
    const parentId = task.recurringParentId ?? task.id;

    // Update this task
    await db.tasks.update(id, { ...changes, updatedAt: now });

    // Update every pending sibling
    const siblings = await db.tasks
      .where('recurringParentId')
      .equals(parentId)
      .toArray();

    for (const sibling of siblings) {
      if (sibling.id !== id && sibling.status !== 'done') {
        await db.tasks.update(sibling.id, { ...changes, updatedAt: now });
      }
    }
  },

  /**
   * Set recurring = 'none' on the given task and all pending siblings in the
   * same series so no further occurrences are generated.
   */
  async stopRecurring(id: string): Promise<void> {
    const task = await db.tasks.get(id);
    if (!task) return;

    const now      = new Date().toISOString();
    const parentId = task.recurringParentId ?? task.id;

    await db.tasks.update(id, { recurring: 'none', updatedAt: now });

    const siblings = await db.tasks
      .where('recurringParentId')
      .equals(parentId)
      .toArray();

    for (const sibling of siblings) {
      if (sibling.id !== id && sibling.status !== 'done') {
        await db.tasks.update(sibling.id, { recurring: 'none', updatedAt: now });
      }
    }
  },

  // ── Data management ─────────────────────────────────────────────────────

  /** Permanently delete all completed tasks. Returns the count removed. */
  async clearCompleted(): Promise<number> {
    const done = await db.tasks.where('status').equals('done').toArray();
    await db.tasks.bulkDelete(done.map((t) => t.id));
    return done.length;
  },

  /** Serialize all tasks to a JSON string for export. */
  async exportJSON(): Promise<string> {
    const all = await db.tasks.toArray();
    return JSON.stringify(all, null, 2);
  },

  /**
   * Parse a previously exported JSON string and upsert all tasks.
   * Returns the number of tasks imported.
   */
  async importJSON(text: string): Promise<number> {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Expected an array of tasks');
    await db.tasks.bulkPut(parsed);
    return parsed.length;
  },

  // ── Stats (for dashboard) ────────────────────────────────────────────────

  async getStats() {
    const all   = await db.tasks.toArray();
    const done  = all.filter((t) => t.status === 'done');
    const today = new Date().toISOString().slice(0, 10);

    const overdue        = all.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done');
    const completedToday = done.filter((t) => t.completedAt?.startsWith(today));

    // ── Priority breakdown ──────────────────────────────────────────────
    const priorityBreakdown = { high: 0, medium: 0, low: 0, none: 0 };
    for (const t of all) priorityBreakdown[t.priority]++;

    // ── Category breakdown ──────────────────────────────────────────────
    const categoryBreakdown = { work: 0, personal: 0, project: 0, routine: 0, uncategorized: 0 };
    for (const t of all) {
      const key = (t.category ?? 'uncategorized') as keyof typeof categoryBreakdown;
      categoryBreakdown[key]++;
    }

    // ── Last 7 days completions (oldest → newest) ───────────────────────
    const weeklyCompletions = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const date  = d.toISOString().slice(0, 10);
      const count = done.filter((t) => t.completedAt?.startsWith(date)).length;
      return { date, count };
    });

    // ── Streak (consecutive days with ≥1 completion) ────────────────────
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date          = d.toISOString().slice(0, 10);
      const hasCompletion = done.some((t) => t.completedAt?.startsWith(date));
      if (hasCompletion) {
        streak++;
      } else if (i === 0) {
        continue; // no completion today yet — check yesterday before breaking
      } else {
        break;
      }
    }

    // ── Most productive day of week ─────────────────────────────────────
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun=0 … Sat=6
    for (const t of done) {
      if (t.completedAt) dayCounts[new Date(t.completedAt).getDay()]++;
    }
    const DAY_NAMES     = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDay        = Math.max(...dayCounts);
    const mostProductiveDay = maxDay > 0 ? DAY_NAMES[dayCounts.indexOf(maxDay)] : null;

    return {
      total:              all.length,
      completed:          done.length,
      completedToday:     completedToday.length,
      dueToday:           all.filter((t) => t.dueDate === today).length,
      overdue:            overdue.length,
      completionRate:     all.length ? Math.round((done.length / all.length) * 100) : 0,
      priorityBreakdown,
      categoryBreakdown,
      weeklyCompletions,
      streak,
      mostProductiveDay,
    };
  },
};
