import type { DbOrTx } from '@/db/drizzle';
import { auditLog, type ActorType } from '@/db/schema';

export type Actor = { type: 'user'; id: string } | { type: 'api_key'; id: string } | { type: 'system'; id?: string };

export const systemActor: Actor = { type: 'system', id: 'worker' };

export type AuditInput = {
  companyId?: string | null;
  actor: Actor;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason?: string | null;
  causeEventId?: string | null;
  employeeId?: string | null;
  data?: Record<string, unknown>;
};

export async function audit(tx: DbOrTx, ...entries: AuditInput[]): Promise<void> {
  if (entries.length === 0) return;
  await tx.insert(auditLog).values(
    entries.map(entry => ({
      companyId: entry.companyId ?? null,
      actorType: entry.actor.type satisfies ActorType,
      actorId: entry.actor.id ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      reason: entry.reason ?? null,
      causeEventId: entry.causeEventId ?? null,
      employeeId: entry.employeeId ?? null,
      data: entry.data ?? null,
    })),
  );
}
