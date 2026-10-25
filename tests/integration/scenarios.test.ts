import { and, count, eq, inArray } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { auditLog, hrEvents, licenses, seatAssignments } from '@/db/schema';
import { systemActor } from '@/lib/services/audit';
import { processEvent } from '@/lib/services/hr-events';
import { checkLicense } from '@/lib/services/license-check';
import { expireLicenses } from '@/lib/services/pools';
import { deleteRule } from '@/lib/services/rules';

import {
  createProductWithPlan,
  createTestCompany,
  employeeByHrId,
  linkedUser,
  poolState,
  seatHistory,
} from './fixtures';

const hrId = (n: number) => `E-${String(n).padStart(4, '0')}`;

async function setup(seats: number, developers: number) {
  const { product, plan } = await createProductWithPlan(seats);
  const test = await createTestCompany();
  await test.rule('developer', product.id);
  await test.license(plan.id);
  for (let i = 1; i <= developers; i++) await test.hire(hrId(i));
  return { test, product, plan };
}

async function auditCount(companyId: string) {
  const [row] = await db.select({ value: count() }).from(auditLog).where(eq(auditLog.companyId, companyId));
  return row.value;
}

describe('S1–S3: allocation, waitlist and freed seats', () => {
  it('S1: 5 seats, 3 developers hired → 3 assigned, 2 free, every check allowed', async () => {
    const { test, product } = await setup(5, 3);
    const pool = await poolState(test.company.id, product.id);
    expect(pool.assigned).toEqual([hrId(1), hrId(2), hrId(3)]);
    expect(pool.waiting).toEqual([]);
    for (let i = 1; i <= 3; i++) {
      const user = await linkedUser(test, hrId(i));
      const result = await user.check(product.slug);
      expect(result.found && result.decision.allowed).toBe(true);
    }
  });

  it('S2: 20/20 assigned, developer #21 waits at position 1 and is denied WAITLISTED', async () => {
    const { test, product } = await setup(20, 21);
    const pool = await poolState(test.company.id, product.id);
    expect(pool.assigned).toHaveLength(20);
    expect(pool.waiting).toEqual([hrId(21)]);
    const user = await linkedUser(test, hrId(21));
    const result = await user.check(product.slug);
    expect(result.found && result.decision).toMatchObject({
      allowed: false,
      reason: 'WAITLISTED',
      waitlistPosition: 1,
    });
  });

  it('S3: #5 terminated → revoked, #21 assigned with SEAT_FREED by the same event', async () => {
    const { test, product } = await setup(20, 21);
    const five = await linkedUser(test, hrId(5));
    const twentyOne = await linkedUser(test, hrId(21));
    const { ingested } = await test.terminate(hrId(5));

    const pool = await poolState(test.company.id, product.id);
    expect(pool.assigned).toContain(hrId(21));
    expect(pool.assigned).not.toContain(hrId(5));
    expect(pool.waiting).toEqual([]);

    const revoked = (await seatHistory((await employeeByHrId(test.company.id, hrId(5))).id)).at(-1)!;
    const granted = (await seatHistory((await employeeByHrId(test.company.id, hrId(21))).id)).at(-1)!;
    expect(revoked).toMatchObject({ status: 'revoked', endReason: 'EMPLOYEE_TERMINATED', causeEventId: ingested.id });
    expect(granted).toMatchObject({ status: 'assigned', grantReason: 'SEAT_FREED', causeEventId: ingested.id });

    const denied = await five.check(product.slug);
    const allowed = await twentyOne.check(product.slug);
    expect(denied.found && denied.decision).toMatchObject({ allowed: false, reason: 'NOT_ELIGIBLE' });
    expect(allowed.found && allowed.decision.allowed).toBe(true);
  });
});

describe('S5, S6, S14: idempotency and staleness', () => {
  it('S5: the same event twice → duplicate; state, seats and audit unchanged', async () => {
    const { test, product } = await setup(5, 1);
    const first = await test.send('employee.hired', hrId(2), { jobRole: 'developer', eventId: 'evt-dup' });
    const before = { audit: await auditCount(test.company.id), pool: await poolState(test.company.id, product.id) };

    const second = await test.send('employee.hired', hrId(2), {
      jobRole: 'developer',
      eventId: 'evt-dup',
      occurredAt: first.event.occurredAt,
    });
    expect(second.ingested.status).toBe('duplicate');
    expect(second.processed).toBeNull();
    expect(await auditCount(test.company.id)).toBe(before.audit);
    expect(await poolState(test.company.id, product.id)).toEqual(before.pool);
    const [event] = await db.select().from(hrEvents).where(eq(hrEvents.eventId, 'evt-dup'));
    expect(event).toMatchObject({ status: 'processed', duplicateCount: 1 });
  });

  it('S14: same eventId with a different jobRole → EVENT_ID_CONFLICT, nothing changes', async () => {
    const { test, product } = await setup(5, 0);
    const first = await test.send('employee.hired', hrId(1), { jobRole: 'designer', eventId: 'evt-x' });
    const before = await auditCount(test.company.id);
    await expect(
      test.send('employee.hired', hrId(1), {
        jobRole: 'developer',
        eventId: 'evt-x',
        occurredAt: first.event.occurredAt,
      }),
    ).rejects.toMatchObject({ code: 'EVENT_ID_CONFLICT' });
    expect(await auditCount(test.company.id)).toBe(before);
    expect((await employeeByHrId(test.company.id, hrId(1))).jobRole).toBe('designer');
    expect((await poolState(test.company.id, product.id)).assigned).toEqual([]);
  });

  it('S6: hired T1, terminated T3, late hire T2 → stale, the employee stays terminated without a seat', async () => {
    const { test, product } = await setup(5, 0);
    const t = (minute: number) => new Date(Date.UTC(2026, 10, 3, 9, minute)).toISOString();
    await test.hire(hrId(1), 'developer', { occurredAt: t(1) });
    await test.terminate(hrId(1), { occurredAt: t(3) });
    const late = await test.hire(hrId(1), 'developer', { occurredAt: t(2) });

    expect(late.processed).toMatchObject({ outcome: 'stale' });
    const employee = await employeeByHrId(test.company.id, hrId(1));
    expect(employee.status).toBe('terminated');
    expect(employee.stateAsOf.toISOString()).toBe(t(3));
    expect((await poolState(test.company.id, product.id)).assigned).toEqual([]);
  });

  it('BR-10: a role change for an unknown employee creates them as active', async () => {
    const { test, product } = await setup(5, 0);
    await test.changeRole('E-LOST-HIRE', 'developer');
    const employee = await employeeByHrId(test.company.id, 'E-LOST-HIRE');
    expect(employee).toMatchObject({ status: 'active', jobRole: 'developer' });
    expect((await poolState(test.company.id, product.id)).assigned).toEqual(['E-LOST-HIRE']);
  });

  it('BR-16: a rehire queues with a new eligibleSince (no restored seniority)', async () => {
    const { test, product } = await setup(1, 1);
    await test.hire(hrId(2));
    await test.terminate(hrId(1));
    const rehire = await test.hire(hrId(1));
    const pool = await poolState(test.company.id, product.id);
    expect(pool.assigned).toEqual([hrId(2)]);
    expect(pool.waiting).toEqual([hrId(1)]);
    const row = pool.rows.find(r => r.hrId === hrId(1))!;
    expect(row.eligibleSince.toISOString()).toBe(rehire.event.occurredAt);
  });
});

describe('S7, S8: role changes and rule removal', () => {
  it('S7: developer → accountant: IDE seat revoked and passed on; Office seat assigned', async () => {
    const ide = await createProductWithPlan(2);
    const office = await createProductWithPlan(5);
    const test = await createTestCompany();
    await test.rule('developer', ide.product.id);
    await test.rule('accountant', office.product.id);
    await test.license(ide.plan.id);
    await test.license(office.plan.id);
    await test.hire(hrId(1));
    await test.hire(hrId(2));
    await test.hire(hrId(3));

    const { ingested } = await test.changeRole(hrId(1), 'accountant');
    const idePool = await poolState(test.company.id, ide.product.id);
    expect(idePool.assigned).toEqual([hrId(2), hrId(3)]);
    expect((await poolState(test.company.id, office.product.id)).assigned).toEqual([hrId(1)]);

    const history = await seatHistory((await employeeByHrId(test.company.id, hrId(1))).id);
    expect(history.find(row => row.productId === ide.product.id)).toMatchObject({
      status: 'revoked',
      endReason: 'ROLE_NO_LONGER_ELIGIBLE',
      causeEventId: ingested.id,
    });
  });

  it('S8: deleting developer → ide-pro revokes every seat and cancels the waitlist with RULE_REMOVED', async () => {
    const { test, product } = await setup(2, 3);
    const user = await linkedUser(test, hrId(1));
    const [rule] = await db.query.entitlementRules.findMany({
      where: (r, { eq: same }) => same(r.companyId, test.company.id),
    });
    await deleteRule(test.ownerActor, test.company.id, rule.id);

    const rows = await db
      .select({ status: seatAssignments.status, endReason: seatAssignments.endReason })
      .from(seatAssignments)
      .where(eq(seatAssignments.productId, product.id));
    expect(rows.filter(r => r.status === 'revoked')).toHaveLength(2);
    expect(rows.filter(r => r.status === 'cancelled')).toHaveLength(1);
    expect(rows.every(r => r.endReason === 'RULE_REMOVED')).toBe(true);
    const result = await user.check(product.slug);
    expect(result.found && result.decision).toMatchObject({ allowed: false, reason: 'NOT_ELIGIBLE' });
  });
});

describe('S9: capacity reduction (BR-07, BR-11 d)', () => {
  it('one of two 10-seat licences expires: the 10 newest seats are denied at once, then requeued with their eligibleSince', async () => {
    const { product, plan } = await createProductWithPlan(10);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.license(plan.id);
    await test.license(plan.id);
    for (let i = 1; i <= 20; i++) await test.hire(hrId(i));
    const oldest = await linkedUser(test, hrId(1));
    const newest = await linkedUser(test, hrId(20));
    expect((await poolState(test.company.id, product.id)).assigned).toHaveLength(20);

    const [first] = await db.select().from(licenses).where(eq(licenses.companyId, test.company.id)).limit(1);
    const expiredAt = new Date(Date.now() - 1000);
    await db.update(licenses).set({ validUntil: expiredAt }).where(eq(licenses.id, first.id));

    const deniedNow = await newest.check(product.slug);
    expect(deniedNow.found && deniedNow.decision).toMatchObject({ allowed: false, reason: 'NO_VALID_LICENSE' });
    const stillAllowed = await oldest.check(product.slug);
    expect(stillAllowed.found && stillAllowed.decision.allowed).toBe(true);

    const result = await expireLicenses(systemActor);
    expect(result).toMatchObject({ licenses: 1, requeued: 10 });
    const pool = await poolState(test.company.id, product.id);
    expect(pool.assigned).toEqual(Array.from({ length: 10 }, (_, i) => hrId(i + 1)));
    expect(pool.waiting).toEqual(Array.from({ length: 10 }, (_, i) => hrId(i + 11)));
    const requeued = pool.rows.find(r => r.hrId === hrId(20))!;
    const hire20 = await db
      .select()
      .from(hrEvents)
      .where(and(eq(hrEvents.companyId, test.company.id), eq(hrEvents.hrId, hrId(20))));
    expect(requeued.eligibleSince.getTime()).toBe(hire20[0].occurredAt.getTime());

    const waitlisted = await newest.check(product.slug);
    expect(waitlisted.found && waitlisted.decision).toMatchObject({
      allowed: false,
      reason: 'WAITLISTED',
      waitlistPosition: 10,
    });
    expect(await expireLicenses(systemActor)).toMatchObject({ licenses: 0 });
  });
});

describe('S11: failure injected after the allocation, before the commit', () => {
  it('leaves no partial state, records the failure, and a retry reaches the S3 result', async () => {
    const { test, product } = await setup(20, 21);
    const before = await poolState(test.company.id, product.id);
    const auditBefore = await auditCount(test.company.id);

    const { ingested, processed } = await test.terminate(hrId(5), {}, { injectFault: () => true });
    expect(processed).toMatchObject({ outcome: 'failed' });
    expect(await poolState(test.company.id, product.id)).toEqual(before);
    expect(await auditCount(test.company.id)).toBe(auditBefore);
    expect((await employeeByHrId(test.company.id, hrId(5))).status).toBe('active');
    const [failed] = await db.select().from(hrEvents).where(eq(hrEvents.id, ingested.id));
    expect(failed).toMatchObject({ status: 'failed', attempts: 1 });
    expect(failed.lastError).toContain('Injected fault');
    expect(failed.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());

    expect(await processEvent(ingested.id)).toMatchObject({ outcome: 'processed' });
    const after = await poolState(test.company.id, product.id);
    expect(after.assigned).toContain(hrId(21));
    expect(after.assigned).not.toContain(hrId(5));
    const [done] = await db.select().from(hrEvents).where(eq(hrEvents.id, ingested.id));
    expect(done).toMatchObject({ status: 'processed', attempts: 2, lastError: null });
  });
});

describe('S13 and BR-18: management roles grant no usage right', () => {
  it('S13: an owner who is not in the HR feed is denied NOT_LINKED', async () => {
    const { test, product } = await setup(5, 1);
    const result = await checkLicense({ userId: test.owner.id }, product.slug);
    expect(result.found && result.decision).toMatchObject({ allowed: false, reason: 'NOT_LINKED' });
  });

  it('BR-18: a removed member keeps the seat, but the check is denied until linked again', async () => {
    const { test, product } = await setup(5, 1);
    const user = await linkedUser(test, hrId(1));
    const { removeMember } = await import('@/lib/services/companies');
    await removeMember(test.ownerActor, 'owner', test.company.id, user.membership.id);
    expect((await poolState(test.company.id, product.id)).assigned).toEqual([hrId(1)]);
    const result = await user.check(product.slug);
    expect(result.found && result.decision).toMatchObject({ allowed: false, reason: 'NOT_MEMBER' });
  });
});

describe('BR-04 safety net', () => {
  it('a plan can never be applied above capacity: the open-row index and the post-check hold', async () => {
    const { test, product } = await setup(3, 3);
    const employee = await employeeByHrId(test.company.id, hrId(1));
    await expect(
      db.insert(seatAssignments).values({
        companyId: test.company.id,
        productId: product.id,
        employeeId: employee.id,
        status: 'waiting',
        eligibleSince: new Date(),
        queueReason: 'RULE_MATCHED',
      }),
    ).rejects.toThrow();
    const open = await db
      .select({ value: count() })
      .from(seatAssignments)
      .where(and(eq(seatAssignments.companyId, test.company.id), inArray(seatAssignments.status, ['assigned'])));
    expect(open[0].value).toBe(3);
  });
});
