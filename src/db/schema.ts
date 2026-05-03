import Dexie, { type Table } from 'dexie';
import type { Task, AppSettings } from '@/types';

// ── Database definition ───────────────────────────────────────────────────

export class QuickTodoDB extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<AppSettings & { id: string }, string>;

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
  }
}

export const db = new QuickTodoDB();
