import '../scripts/load-env';

import { pool } from '@/db/drizzle';
import { logger } from '@/lib/logger';
import { systemActor } from '@/lib/services/audit';
import { processDueEvents } from '@/lib/services/hr-events';
import { expireLicenses, listLiveCompanyIds, reconcileCompany } from '@/lib/services/pools';

const EVENT_INTERVAL_MS = Number(process.env.WORKER_EVENT_INTERVAL_MS ?? 5_000);
const MAINTENANCE_INTERVAL_MS = Number(process.env.WORKER_MAINTENANCE_INTERVAL_MS ?? 60_000);

let stopping = false;
const timers = new Set<NodeJS.Timeout>();

function every(name: string, interval: number, task: () => Promise<void>) {
  const tick = async () => {
    if (stopping) return;
    const started = performance.now();
    try {
      await task();
    } catch (error) {
      logger.error('worker.task_failed', { task: name, error });
    }
    if (stopping) return;
    const delay = Math.max(0, interval - (performance.now() - started));
    const timer = setTimeout(() => {
      timers.delete(timer);
      void tick();
    }, delay);
    timers.add(timer);
  };
  void tick();
}

async function processEvents() {
  const results = await processDueEvents();
  if (results.length > 0) {
    const outcomes = results.reduce<Record<string, number>>(
      (acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] ?? 0) + 1 }),
      {},
    );
    logger.info('worker.events', { processed: results.length, ...outcomes });
  }
}

async function maintenance() {
  const now = new Date();
  const expiry = await expireLicenses(systemActor, now);
  if (expiry.licenses > 0) logger.info('worker.licenses_expired', expiry);

  let changes = 0;
  const companyIds = await listLiveCompanyIds();
  for (const companyId of companyIds) {
    if (stopping) break;
    try {
      const result = await reconcileCompany(companyId, systemActor, { now, auditUnchanged: false });
      if (result.changes > 0) logger.warn('worker.reconcile_drift', { companyId, changes: result.changes });
      changes += result.changes;
    } catch (error) {
      logger.error('worker.reconcile_failed', { companyId, error });
    }
  }
  logger.debug('worker.maintenance', { companies: companyIds.length, changes });
}

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info('worker.stopping', { signal });
  for (const timer of timers) clearTimeout(timer);
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

logger.info('worker.started', { eventIntervalMs: EVENT_INTERVAL_MS, maintenanceIntervalMs: MAINTENANCE_INTERVAL_MS });
every('events', EVENT_INTERVAL_MS, processEvents);
every('maintenance', MAINTENANCE_INTERVAL_MS, maintenance);
