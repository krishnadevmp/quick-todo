import { getDB, type SyncEntity, type SyncOp, type SyncQueueItem } from '@/db/schema';

// ── Outbox ────────────────────────────────────────────────────────────────
// A tiny durable queue of "this entity needs to be pushed" markers — never
// full payloads. The sync engine reads the *current* state of the entity
// from Dexie at flush time, so rapid repeated edits naturally coalesce into
// one API call instead of replaying every intermediate change.

function keyFor(entity: SyncEntity, entityId: string): string {
  return `${entity}:${entityId}`;
}

export async function enqueue(entity: SyncEntity, entityId: string, op: SyncOp): Promise<void> {
  const db = getDB();
  const id = keyFor(entity, entityId);
  const existing = await db.syncQueue.get(id);

  // A queued delete always wins — never let a later upsert/insert resurrect it.
  if (existing?.op === 'delete' && op !== 'delete') return;

  // A still-pending insert must stay an insert — the row doesn't exist
  // server-side yet, so an edit queued before the create ever flushes
  // shouldn't downgrade it into a PATCH that's guaranteed to 404.
  const resolvedOp: SyncOp = existing?.op === 'insert' && op === 'upsert' ? 'insert' : op;

  const item: SyncQueueItem = {
    id,
    entity,
    entityId,
    op: resolvedOp,
    // Preserve original queue position on repeated upserts to the same id.
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await db.syncQueue.put(item);
}

export async function all(): Promise<SyncQueueItem[]> {
  return getDB().syncQueue.orderBy('createdAt').toArray();
}

export async function remove(id: string): Promise<void> {
  await getDB().syncQueue.delete(id);
}

export async function count(): Promise<number> {
  return getDB().syncQueue.count();
}
