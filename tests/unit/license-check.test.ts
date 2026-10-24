import { describe, expect, it } from 'vitest';

import { decideCheck, type CompanyEvaluation } from '@/lib/domain/license-check';

const at = new Date('2026-11-03T09:00:01Z');

function company(id: string, employee: CompanyEvaluation['employee'], capacity = 20): CompanyEvaluation {
  return { companyId: id, companyName: `Company ${id}`, employee, capacity };
}

describe('BR-11 / §7.3 licence check decision', () => {
  it('NOT_MEMBER without any membership', () => {
    expect(decideCheck([])).toEqual({ allowed: false, reason: 'NOT_MEMBER' });
  });

  it('S13: NOT_LINKED for an admin who is not in the HR feed', () => {
    expect(decideCheck([company('a', null)])).toMatchObject({ allowed: false, reason: 'NOT_LINKED' });
  });

  it('S8: NOT_ELIGIBLE for a linked employee without a seat row', () => {
    expect(decideCheck([company('a', { seat: null })])).toMatchObject({ reason: 'NOT_ELIGIBLE' });
  });

  it('S2: WAITLISTED with the position', () => {
    expect(decideCheck([company('a', { seat: { status: 'waiting', position: 1 } })])).toMatchObject({
      allowed: false,
      reason: 'WAITLISTED',
      waitlistPosition: 1,
    });
  });

  it('S1: allowed with an assigned seat within capacity', () => {
    expect(decideCheck([company('a', { seat: { status: 'assigned', assignedAt: at, rank: 3 } }, 5)])).toEqual({
      allowed: true,
      companyId: 'a',
      companyName: 'Company a',
      assignedAt: at,
    });
  });

  it('S9 / BR-11 d: NO_VALID_LICENSE when the seat rank exceeds the current capacity', () => {
    expect(decideCheck([company('a', { seat: { status: 'assigned', assignedAt: at, rank: 11 } }, 10)])).toMatchObject({
      allowed: false,
      reason: 'NO_VALID_LICENSE',
    });
    expect(decideCheck([company('a', { seat: { status: 'assigned', assignedAt: at, rank: 10 } }, 10)]).allowed).toBe(
      true,
    );
  });

  it('one allowed company is enough and is named in the answer', () => {
    const decision = decideCheck([
      company('a', null),
      company('b', { seat: { status: 'assigned', assignedAt: at, rank: 1 } }),
      company('c', { seat: { status: 'waiting', position: 4 } }),
    ]);
    expect(decision).toMatchObject({ allowed: true, companyId: 'b' });
  });

  it('reports the most specific denial: WAITLISTED > NO_VALID_LICENSE > NOT_ELIGIBLE > NOT_LINKED', () => {
    const notLinked = company('a', null);
    const notEligible = company('b', { seat: null });
    const noLicense = company('c', { seat: { status: 'assigned', assignedAt: at, rank: 2 } }, 1);
    const waitlisted = company('d', { seat: { status: 'waiting', position: 7 } });
    expect(decideCheck([notLinked, notEligible])).toMatchObject({ reason: 'NOT_ELIGIBLE' });
    expect(decideCheck([notLinked, notEligible, noLicense])).toMatchObject({ reason: 'NO_VALID_LICENSE' });
    expect(decideCheck([noLicense, waitlisted, notLinked])).toMatchObject({
      reason: 'WAITLISTED',
      waitlistPosition: 7,
    });
  });

  it('reports the closest waitlist position across companies', () => {
    expect(
      decideCheck([
        company('a', { seat: { status: 'waiting', position: 9 } }),
        company('b', { seat: { status: 'waiting', position: 2 } }),
      ]),
    ).toMatchObject({ reason: 'WAITLISTED', waitlistPosition: 2, companyId: 'b' });
  });
});
