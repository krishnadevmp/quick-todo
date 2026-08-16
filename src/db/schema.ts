import Dexie, { type Table } from 'dexie';
import type { Task, AppSettings, Expense } from '@/types';

// ── Sync queue (outbox) ───────────────────────────────────────────────────
// See src/sync/outbox.ts / src/sync/syncEngine.ts. Only used when signed in
// (authStore.mode === 'account') — guest mode never writes to this table.

export type SyncEntity = 'task' | 'expense' | 'settings';
export type SyncOp = 'upsert' | 'delete';

export interface SyncQueueItem {
  /** entity + entityId, e.g. "task:<uuid>" — also the Dexie primary key, so
   *  re-enqueuing the same entity naturally overwrites the previous entry */
  id: string;
  entity: SyncEntity;
  entityId: string;
  op: SyncOp;
  createdAt: string;
}

// ── Database definition ───────────────────────────────────────────────────
//
// Scoped per "who's using the app": guest mode keeps the original database
// name (`QuickTodoDB`) unchanged so existing local data is never orphaned.
// Signed-in accounts get their own database (`QuickTodoDB__<userId>`) so
// switching accounts — or declining to import guest data — can never mix
// or clobber another scope's rows. See getDB()/setActiveScope() below.

export class QuickTodoDB extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<AppSettings & { id: string }, string>;
  expenses!: Table<Expense, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor(scopeKey: string) {
    super(scopeKey === 'guest' ? 'QuickTodoDB' : `QuickTodoDB__${scopeKey}`);

    const v1v2Stores = {
      tasks:
        'id, status, priority, category, dueDate, createdAt, *tags, recurringParentId',
      settings: 'id',
    };

    this.version(1).stores(v1v2Stores);

    // v2: adds expense tracking. Existing stores are re-declared unchanged —
    // Dexie deletes any store omitted from a version's stores() call.
    this.version(2).stores({
      ...v1v2Stores,
      // Indexed fields: category, date, createdAt
      expenses: 'id, category, date, createdAt',
    });

    // v3: adds the sync outbox (see SyncQueueItem above).
    this.version(3).stores({
      ...v1v2Stores,
      expenses: 'id, category, date, createdAt',
      syncQueue: 'id, entity, entityId, op, createdAt',
    });
  }
}

// ── Active scope ──────────────────────────────────────────────────────────
// A module-level "current" instance, swapped by setActiveScope() whenever
// auth state changes (guest <-> a specific signed-in user). Repositories
// call getDB() instead of importing a fixed instance so they automatically
// follow whichever scope is active — no other changes needed on their end.

let activeScopeKey = 'guest';
let activeDB: QuickTodoDB = new QuickTodoDB(activeScopeKey);

export function getDB(): QuickTodoDB {
  return activeDB;
}

export function setActiveScope(scopeKey: string): QuickTodoDB {
  if (scopeKey !== activeScopeKey) {
    activeScopeKey = scopeKey;
    activeDB = new QuickTodoDB(scopeKey);
  }
  return activeDB;
}

/** Back-compat named export — some call sites still import `db` directly. */
export const db = new Proxy({} as QuickTodoDB, {
  get(_target, prop) {
    return (getDB() as unknown as Record<PropertyKey, unknown>)[prop as string];
  },
});
