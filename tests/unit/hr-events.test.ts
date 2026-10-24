import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  hrEventSchema,
  isStale,
  MAX_ATTEMPTS,
  nextAttemptAt,
  nextEmployeeState,
  type HrEventInput,
} from '@/lib/domain/hr-events';

const hired: HrEventInput = {
  eventId: 'evt-2026-11-03-0001',
  type: 'employee.hired',
  occurredAt: '2026-11-03T09:00:00Z',
  employee: { hrId: 'E-1042', email: 'kiss.anna@example.com', name: 'Kiss Anna', jobRole: 'developer' },
};

describe('§7.1 event schema (S15)', () => {
  it('accepts the documented example', () => {
    expect(hrEventSchema.safeParse(hired).success).toBe(true);
  });

  it.each([
    ['missing hrId', { ...hired, employee: { ...hired.employee, hrId: undefined } }],
    ['bad occurredAt', { ...hired, occurredAt: 'tegnap' }],
    ['unknown type', { ...hired, type: 'employee.promoted' }],
    ['jobRole with uppercase', { ...hired, employee: { ...hired.employee, jobRole: 'Developer' } }],
    ['jobRole too long', { ...hired, employee: { ...hired.employee, jobRole: 'x'.repeat(65) } }],
    ['eventId too long', { ...hired, eventId: 'e'.repeat(129) }],
    ['hire without jobRole', { ...hired, employee: { hrId: 'E-1' } }],
    ['unknown field', { ...hired, companyId: 'someone-else' }],
  ])('rejects %s', (_label, body) => {
    expect(hrEventSchema.safeParse(body).success).toBe(false);
  });

  it('allows a termination with only the hrId', () => {
    const result = hrEventSchema.safeParse({
      eventId: 'evt-2',
      type: 'employee.terminated',
      occurredAt: '2026-11-03T10:00:00+01:00',
      employee: { hrId: 'E-1042' },
    });
    expect(result.success).toBe(true);
  });
});

describe('BR-08 payload identity', () => {
  it('hashes the same content identically regardless of key order', () => {
    const reordered = {
      employee: { jobRole: 'developer', name: 'Kiss Anna', email: 'kiss.anna@example.com', hrId: 'E-1042' },
      occurredAt: hired.occurredAt,
      type: hired.type,
      eventId: hired.eventId,
    };
    expect(canonicalJson(reordered)).toBe(canonicalJson(hired));
  });

  it('differs when a field differs (S14)', () => {
    expect(canonicalJson({ ...hired, employee: { ...hired.employee, jobRole: 'designer' } })).not.toBe(
      canonicalJson(hired),
    );
  });
});

describe('BR-09 staleness and §3.3 state', () => {
  it('treats an event at or before stateAsOf as stale (S6)', () => {
    const t3 = new Date('2026-11-03T12:00:00Z');
    expect(isStale(new Date('2026-11-03T11:00:00Z'), t3)).toBe(true);
    expect(isStale(t3, t3)).toBe(true);
    expect(isStale(new Date('2026-11-03T12:00:01Z'), t3)).toBe(false);
  });

  it('BR-10: applies role_changed and terminated to an unknown employee as an upsert', () => {
    expect(nextEmployeeState(null, { ...hired, type: 'employee.role_changed' })).toMatchObject({
      status: 'active',
      jobRole: 'developer',
    });
    expect(
      nextEmployeeState(null, { ...hired, type: 'employee.terminated', employee: { hrId: 'E-1042' } }),
    ).toMatchObject({ status: 'terminated', jobRole: '' });
  });

  it('keeps known contact data when an event omits it', () => {
    const current = { status: 'active' as const, jobRole: 'developer', email: 'a@example.com', name: 'A' };
    expect(
      nextEmployeeState(current, {
        ...hired,
        type: 'employee.role_changed',
        employee: { hrId: 'E-1', jobRole: 'designer' },
      }),
    ).toEqual({ status: 'active', jobRole: 'designer', email: 'a@example.com', name: 'A' });
  });

  it('a newer hire after a termination is a rehire (active again)', () => {
    const terminated = { status: 'terminated' as const, jobRole: 'developer', email: null, name: null };
    expect(nextEmployeeState(terminated, hired).status).toBe('active');
  });
});

describe('EMP-7 retry backoff', () => {
  const now = new Date('2026-11-03T09:00:00Z');
  it('retries after 1 s, 5 s, 30 s, 2 min, 10 min and then gives up', () => {
    const delays = [1, 2, 3, 4, 5].map(attempt => nextAttemptAt(attempt, now)!.getTime() - now.getTime());
    expect(delays).toEqual([1_000, 5_000, 30_000, 120_000, 600_000]);
    expect(MAX_ATTEMPTS).toBe(6);
    expect(nextAttemptAt(MAX_ATTEMPTS, now)).toBeNull();
  });
});
