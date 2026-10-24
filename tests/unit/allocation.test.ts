import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { InvariantViolation, planPool, waitlistPositions, type OpenRow } from '@/lib/domain/allocation';
import { compareWaitlist } from '@/lib/domain/seniority';

import { applyPlan, assignedRow, employee, t, waitingRow } from './pool-simulator';

const terminated = () => 'EMPLOYEE_TERMINATED' as const;

describe('planPool — scenarios', () => {
  it('S1: 5 seats, 3 newly eligible developers → 3 assigned, 2 free', () => {
    const plan = planPool({
      capacity: 5,
      eligible: [employee(1, t(0)), employee(2, t(1)), employee(3, t(2))],
      current: [],
      reasonFor: terminated,
    });
    expect(plan.filter(a => a.type === 'ENQUEUE')).toHaveLength(3);
    expect(plan.filter(a => a.type === 'ASSIGN')).toEqual([
      { type: 'ASSIGN', employeeId: 'emp-1', reason: 'RULE_MATCHED' },
      { type: 'ASSIGN', employeeId: 'emp-2', reason: 'RULE_MATCHED' },
      { type: 'ASSIGN', employeeId: 'emp-3', reason: 'RULE_MATCHED' },
    ]);
  });

  const twentyAssigned = Array.from({ length: 20 }, (_, i) => assignedRow(i + 1, t(i), t(i)));
  const twentyEligible = Array.from({ length: 20 }, (_, i) => employee(i + 1, t(i)));

  it('S2: 20 of 20 assigned, developer #21 is hired → waits at position 1', () => {
    const plan = planPool({
      capacity: 20,
      eligible: [...twentyEligible, employee(21, t(100))],
      current: twentyAssigned,
      reasonFor: terminated,
    });
    expect(plan).toEqual([{ type: 'ENQUEUE', employeeId: 'emp-21', hrId: 'E-0021', eligibleSince: t(100) }]);
  });

  it('S3: #5 terminated → revoked, #21 gets the freed seat in the same plan', () => {
    const plan = planPool({
      capacity: 20,
      eligible: [...twentyEligible.filter(e => e.employeeId !== 'emp-5'), employee(21, t(100))],
      current: [...twentyAssigned, waitingRow(21, t(100))],
      reasonFor: terminated,
    });
    expect(plan).toEqual([
      { type: 'REVOKE', rowId: 'row-5', employeeId: 'emp-5', reason: 'EMPLOYEE_TERMINATED' },
      { type: 'ASSIGN', employeeId: 'emp-21', reason: 'SEAT_FREED' },
    ]);
  });

  it('cancels the waiting row of an employee who is no longer eligible', () => {
    const plan = planPool({
      capacity: 0,
      eligible: [],
      current: [waitingRow(7, t(0))],
      reasonFor: () => 'ROLE_NO_LONGER_ELIGIBLE',
    });
    expect(plan).toEqual([{ type: 'CANCEL', rowId: 'row-7', employeeId: 'emp-7', reason: 'ROLE_NO_LONGER_ELIGIBLE' }]);
  });

  it('S8: rule removed → every seat revoked and the waitlist cancelled with RULE_REMOVED', () => {
    const plan = planPool({
      capacity: 2,
      eligible: [],
      current: [assignedRow(1, t(0), t(0)), assignedRow(2, t(1), t(1)), waitingRow(3, t(2))],
      reasonFor: () => 'RULE_REMOVED',
    });
    expect(plan.map(a => a.type)).toEqual(['REVOKE', 'REVOKE', 'CANCEL']);
    expect(plan.every(a => 'reason' in a && a.reason === 'RULE_REMOVED')).toBe(true);
  });

  it('BR-05: FIFO by eligibleSince, ties broken by HR ID', () => {
    const plan = planPool({
      capacity: 2,
      eligible: [employee(3, t(5)), employee(2, t(5)), employee(1, t(9))],
      current: [],
      reasonFor: terminated,
    });
    expect(plan.filter(a => a.type === 'ASSIGN').map(a => a.employeeId)).toEqual(['emp-2', 'emp-3']);
  });

  it('S9 / BR-07: capacity 20 → 10 requeues the 10 most recently assigned with their eligibleSince', () => {
    const plan = planPool({ capacity: 10, eligible: twentyEligible, current: twentyAssigned, reasonFor: terminated });
    const requeued = plan.filter(a => a.type === 'REQUEUE');
    expect(requeued).toHaveLength(10);
    expect(requeued.map(a => a.employeeId).sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => `emp-${i + 11}`).sort(),
    );
    expect(requeued.find(a => a.employeeId === 'emp-11')).toMatchObject({ eligibleSince: t(10) });
    expect(plan.some(a => a.type === 'ASSIGN')).toBe(false);
  });

  it('BR-07: requeued employees are first in line when capacity returns', () => {
    const afterDrop = applyPlan(
      twentyAssigned,
      planPool({ capacity: 10, eligible: twentyEligible, current: twentyAssigned, reasonFor: terminated }),
      t(200),
    );
    const withNewcomer = [...twentyEligible, employee(21, t(150))];
    const afterNewcomer = applyPlan(
      afterDrop,
      planPool({ capacity: 10, eligible: withNewcomer, current: afterDrop, reasonFor: terminated }),
      t(210),
    );
    const plan = planPool({ capacity: 15, eligible: withNewcomer, current: afterNewcomer, reasonFor: terminated });
    expect(plan.filter(a => a.type === 'ASSIGN')).toEqual(
      [11, 12, 13, 14, 15].map(n => ({ type: 'ASSIGN', employeeId: `emp-${n}`, reason: 'CAPACITY_ADDED' })),
    );
  });

  it('assigns nothing when there is no valid licence', () => {
    const plan = planPool({ capacity: 0, eligible: [employee(1, t(0))], current: [], reasonFor: terminated });
    expect(plan).toEqual([{ type: 'ENQUEUE', employeeId: 'emp-1', hrId: 'E-0001', eligibleSince: t(0) }]);
  });

  it('keeps existing seats when capacity is unchanged (no churn)', () => {
    expect(
      planPool({ capacity: 20, eligible: twentyEligible, current: twentyAssigned, reasonFor: terminated }),
    ).toEqual([]);
  });

  it('rejects two open rows for the same employee', () => {
    expect(() =>
      planPool({
        capacity: 1,
        eligible: [employee(1, t(0))],
        current: [assignedRow(1, t(0), t(0)), { ...waitingRow(1, t(0)), rowId: 'dup' }],
        reasonFor: terminated,
      }),
    ).toThrow(InvariantViolation);
  });

  it('computes 1-based waitlist positions in FIFO order', () => {
    const positions = waitlistPositions([
      { employeeId: 'b', hrId: 'E-2', eligibleSince: t(1) },
      { employeeId: 'a', hrId: 'E-1', eligibleSince: t(1) },
      { employeeId: 'c', hrId: 'E-0', eligibleSince: t(0) },
    ]);
    expect([...positions.entries()]).toEqual([
      ['c', 1],
      ['a', 2],
      ['b', 3],
    ]);
  });
});

const poolArbitrary = fc
  .record({
    capacity: fc.integer({ min: 0, max: 25 }),
    employees: fc.array(
      fc.record({
        eligible: fc.boolean(),
        eligibleSince: fc.integer({ min: 0, max: 50 }),
        row: fc.constantFrom('none', 'waiting', 'assigned'),
        assignedAt: fc.integer({ min: 0, max: 50 }),
      }),
      { maxLength: 30 },
    ),
  })
  .map(({ capacity, employees }) => {
    const eligible = employees.flatMap((e, i) => (e.eligible ? [employee(i, t(e.eligibleSince))] : []));
    const current: OpenRow[] = employees.flatMap((e, i) => {
      if (e.row === 'none') return [];
      return e.row === 'assigned'
        ? [assignedRow(i, t(e.eligibleSince), t(e.assignedAt))]
        : [waitingRow(i, t(e.eligibleSince))];
    });
    return { capacity, eligible, current };
  });

describe('planPool — properties', () => {
  it('BR-04: never more assigned seats than capacity', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const after = applyPlan(input.current, planPool({ ...input, reasonFor: terminated }), t(999));
        expect(after.filter(r => r.status === 'assigned').length).toBeLessThanOrEqual(input.capacity);
      }),
    );
  });

  it('reaches a fixpoint: planning again changes nothing (reconciliation is idempotent)', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const after = applyPlan(input.current, planPool({ ...input, reasonFor: terminated }), t(999));
        expect(planPool({ ...input, current: after, reasonFor: terminated })).toEqual([]);
      }),
    );
  });

  it('BR-02: exactly the eligible employees have an open row afterwards', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const after = applyPlan(input.current, planPool({ ...input, reasonFor: terminated }), t(999));
        expect(after.map(r => r.employeeId).sort()).toEqual(input.eligible.map(e => e.employeeId).sort());
      }),
    );
  });

  it('is work-conserving: someone waits only when the pool is full', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const after = applyPlan(input.current, planPool({ ...input, reasonFor: terminated }), t(999));
        const assigned = after.filter(r => r.status === 'assigned').length;
        const waiting = after.filter(r => r.status === 'waiting').length;
        if (waiting > 0) expect(assigned).toBe(input.capacity);
      }),
    );
  });

  it('BR-05: every newly assigned employee was ahead of everyone still waiting', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const plan = planPool({ ...input, reasonFor: terminated });
        const after = applyPlan(input.current, plan, t(999));
        const newlyAssigned = plan.flatMap(a => (a.type === 'ASSIGN' ? [a.employeeId] : []));
        const stillWaiting = after.filter(r => r.status === 'waiting');
        for (const id of newlyAssigned) {
          const winner = after.find(r => r.employeeId === id)!;
          for (const loser of stillWaiting) {
            expect(compareWaitlist(winner, loser)).toBeLessThan(0);
          }
        }
      }),
    );
  });

  it('never takes a seat from an eligible employee unless capacity forces it', () => {
    fc.assert(
      fc.property(poolArbitrary, input => {
        const plan = planPool({ ...input, reasonFor: terminated });
        const eligibleIds = new Set(input.eligible.map(e => e.employeeId));
        const eligibleAssigned = input.current.filter(
          r => r.status === 'assigned' && eligibleIds.has(r.employeeId),
        ).length;
        const requeued = plan.filter(a => a.type === 'REQUEUE').length;
        expect(requeued).toBe(Math.max(0, eligibleAssigned - input.capacity));
        for (const action of plan) {
          if (action.type === 'REVOKE') expect(eligibleIds.has(action.employeeId)).toBe(false);
        }
      }),
    );
  });
});
