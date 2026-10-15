import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { employees } from '@/db/schema';
import { diffSnapshot, type HrSnapshot } from '@/lib/domain/hr-snapshot';
import { logger } from '@/lib/logger';

import { ingestEvent, type IngestResult } from './hr-events';

export async function ingestSnapshot(context: { companyId: string; apiKeyId: string }, snapshot: HrSnapshot) {
  const stored = await db
    .select({ hrId: employees.hrId, status: employees.status, jobRole: employees.jobRole })
    .from(employees)
    .where(eq(employees.companyId, context.companyId));
  const diff = diffSnapshot(stored, snapshot);

  const accepted: IngestResult[] = [];
  for (const event of diff.events) {
    const result = await ingestEvent(
      { companyId: context.companyId, source: 'api', apiKeyId: context.apiKeyId },
      event,
    );
    if (result.status === 'accepted') accepted.push(result);
  }
  logger.info('hr_snapshot.ingested', {
    companyId: context.companyId,
    snapshotId: snapshot.snapshotId,
    hired: diff.hired,
    roleChanged: diff.roleChanged,
    terminated: diff.terminated,
    unchanged: diff.unchanged,
    accepted: accepted.length,
  });
  return { diff, accepted };
}
