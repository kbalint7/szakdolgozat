import fc from 'fast-check';
import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { seatAssignments } from '@/db/schema';
import { systemActor } from '@/lib/services/audit';
import { reconcileCompany } from '@/lib/services/pools';

import { createProductWithPlan, createTestCompany, employeeByHrId, poolState } from './fixtures';

type Step =
  | { kind: 'hire'; id: number; role: 'developer' | 'designer' }
  | { kind: 'terminate'; id: number }
  | { kind: 'changeRole'; id: number; role: 'developer' | 'designer' };

const step: fc.Arbitrary<Step> = fc.oneof(
  fc.record({
    kind: fc.constant('hire' as const),
    id: fc.integer({ min: 1, max: 8 }),
    role: fc.constantFrom('developer' as const, 'designer' as const),
  }),
  fc.record({ kind: fc.constant('terminate' as const), id: fc.integer({ min: 1, max: 8 }) }),
  fc.record({
    kind: fc.constant('changeRole' as const),
    id: fc.integer({ min: 1, max: 8 }),
    role: fc.constantFrom('developer' as const, 'designer' as const),
  }),
);

describe('reconciliation', () => {
  it(
    'after any sequence of events, reconciling changes nothing (incremental == recomputed)',
    { timeout: 300_000 },
    async () => {
      const { product, plan } = await createProductWithPlan(3);
      let run = 0;
      await fc.assert(
        fc.asyncProperty(fc.array(step, { minLength: 1, maxLength: 15 }), async steps => {
          const test = await createTestCompany(`reconcile #${run++}`);
          await test.rule('developer', product.id);
          await test.license(plan.id);
          for (const s of steps) {
            const hrId = `E-${s.id}`;
            if (s.kind === 'hire') await test.hire(hrId, s.role);
            else if (s.kind === 'terminate') await test.terminate(hrId);
            else await test.changeRole(hrId, s.role);
          }
          const before = await poolState(test.company.id, product.id);
          expect(before.assigned.length).toBeLessThanOrEqual(3);
          const result = await reconcileCompany(test.company.id, systemActor);
          expect(result.changes).toBe(0);
          expect(await poolState(test.company.id, product.id)).toEqual(before);
        }),
        { numRuns: 25 },
      );
    },
  );

  it('restores the correct state after a simulated drift', async () => {
    const { product, plan } = await createProductWithPlan(2);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.license(plan.id);
    await test.hire('E-1');
    await test.hire('E-2');
    await test.hire('E-3');
    const expected = await poolState(test.company.id, product.id);

    const e1 = await employeeByHrId(test.company.id, 'E-1');
    const e3 = await employeeByHrId(test.company.id, 'E-3');
    await db.delete(seatAssignments).where(eq(seatAssignments.employeeId, e1.id));
    await db
      .update(seatAssignments)
      .set({ status: 'assigned', assignedAt: new Date() })
      .where(and(eq(seatAssignments.employeeId, e3.id), eq(seatAssignments.status, 'waiting')));

    const repaired = await reconcileCompany(test.company.id, systemActor);
    expect(repaired.changes).toBeGreaterThan(0);
    const after = await poolState(test.company.id, product.id);
    expect(after.assigned.length).toBe(2);
    expect([...after.assigned, ...after.waiting].sort()).toEqual([...expected.assigned, ...expected.waiting].sort());
    expect((await reconcileCompany(test.company.id, systemActor)).changes).toBe(0);
  });
});
