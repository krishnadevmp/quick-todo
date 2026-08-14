import Dexie, { type Table } from 'dexie';
import type { Task, AppSettings, Expense } from '@/types';

// ── Database definition ───────────────────────────────────────────────────

export class QuickTodoDB extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<AppSettings & { id: string }, string>;
  expenses!: Table<Expense, string>;

  constructor() {
    super('QuickTodoDB');

    this.version(1).stores({
      // Primary key is 'id' (UUID).
      // Indexed fields: status, priority, category, dueDate, createdAt
      // Tags is a multi-entry index so you can query by individual tag
      tasks:
        'id, status, priority, category, dueDate, createdAt, *tags, recurringParentId',

      // Single-row settings store (id = 'global')
      settings: 'id',
    });

    // v2: adds expense tracking. Existing stores are re-declared unchanged —
    // Dexie deletes any store omitted from a version's stores() call.
    this.version(2).stores({
      tasks:
        'id, status, priority, category, dueDate, createdAt, *tags, recurringParentId',
      settings: 'id',

      // Indexed fields: category, date, createdAt
      expenses: 'id, category, date, createdAt',
    });
  }
}

export const db = new QuickTodoDB();
