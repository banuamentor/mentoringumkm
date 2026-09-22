import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export async function logAudit(
  actorProfileId: number | null | undefined,
  action: string,
  entityType: string,
  entityId?: string | number,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(auditLogs).values({
      actorProfileId: actorProfileId || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
