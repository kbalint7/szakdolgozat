import { and, count, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { seatAssignments } from '@/db/schema';
import { ingestEvent, processEvent } from '@/lib/services/hr-events';
import { createRule } from '@/lib/services/rules';

import { createProductWithPlan, createTestCompany, poolState } from './fixtures';

const REPETITIONS = Number(process.env.S4_REPETITIONS ?? 100);

describe('S4: two hires processed in parallel for the last free seat', () => {
  it(`never over-allocates (${REPETITIONS} repetitions)`, { timeout: 600_000 }, async () => {
    const { product, plan } = await createProductWithPlan(20);
    for (let run = 0; run < REPETITIONS; run++) {
      const test = await createTestCompany(`S4 #${run}`);
      await test.rule('developer', product.id);
      await test.license(plan.id);
      for (let i = 1; i <= 19; i++) await test.hire(`E-${i}`);

      const stored = await Promise.all(
        ['E-A', 'E-B'].map((hrId, index) =>
          ingestEvent(
            { companyId: test.company.id, source: 'api', apiKeyId: test.apiKey.id },
            {
              eventId: `s4-${run}-${hrId}`,
              type: 'employee.hired',
              occurredAt: new Date(Date.UTC(2026, 10, 4, 9, 0, index)).toISOString(),
              employee: { hrId, jobRole: 'developer' },
            },
          ),
        ),
      );
      const results = await Promise.all(stored.map(event => processEvent(event.id)));
      expect(results.map(r => r.outcome)).toEqual(['processed', 'processed']);

      const [{ assigned }] = await db
        .select({ assigned: count() })
        .from(seatAssignments)
        .where(
          and(
            eq(seatAssignments.companyId, test.company.id),
            eq(seatAssignments.productId, product.id),
            eq(seatAssignments.status, 'assigned'),
          ),
        );
      expect(assigned).toBe(20);
      const pool = await poolState(test.company.id, product.id);
      expect(pool.waiting).toHaveLength(1);
      const winners = ['E-A', 'E-B'].filter(hrId => pool.assigned.includes(hrId));
      expect(winners).toHaveLength(1);
      expect(pool.waiting).toEqual(['E-A', 'E-B'].filter(hrId => !winners.includes(hrId)));
    }
  });

  it('a rule change and an event racing for the same company stay consistent', { timeout: 60_000 }, async () => {
    const { product, plan } = await createProductWithPlan(5);
    const test = await createTestCompany();
    await test.license(plan.id);
    await test.hire('E-1');
    const stored = await ingestEvent(
      { companyId: test.company.id, source: 'api', apiKeyId: test.apiKey.id },
      { eventId: 'race-1', type: 'employee.terminated', occurredAt: test.nextTime(), employee: { hrId: 'E-1' } },
    );
    await Promise.all([
      processEvent(stored.id),
      createRule(test.ownerActor, test.company.id, { jobRole: 'developer', productId: product.id }),
    ]);
    expect((await poolState(test.company.id, product.id)).assigned).toEqual([]);
  });
});
