import { describe, expect, it } from 'vitest';

import { eligibleProductIds, isEligible, lossReasonForEmployee } from '@/lib/domain/eligibility';
import { can, canRemoveMember, type CompanyAction, type Role } from '@/lib/domain/permissions';

describe('permission matrix (§2.3)', () => {
  const cases: [CompanyAction, Role[]][] = [
    ['company.view', ['owner', 'admin', 'member']],
    ['company.leave', ['admin', 'member']],
    ['company.edit', ['owner']],
    ['company.delete', ['owner']],
    ['members.changeRole', ['owner']],
    ['company.transferOwnership', ['owner']],
    ['members.invite', ['owner', 'admin']],
    ['licenses.purchase', ['owner', 'admin']],
    ['licenses.activate', ['owner', 'admin']],
    ['rules.manage', ['owner', 'admin']],
    ['employees.view', ['owner', 'admin']],
    ['apiKeys.manage', ['owner', 'admin']],
    ['hrEvents.retry', ['owner', 'admin']],
    ['audit.view', ['owner', 'admin']],
  ];

  it.each(cases)('%s is allowed for %j', (action, allowed) => {
    for (const role of ['owner', 'admin', 'member'] as const) {
      expect(can(role, action)).toBe(allowed.includes(role));
    }
  });

  it('admins cannot remove the owner or other admins; nobody removes the owner', () => {
    expect(canRemoveMember('owner', 'admin')).toBe(true);
    expect(canRemoveMember('owner', 'member')).toBe(true);
    expect(canRemoveMember('owner', 'owner')).toBe(false);
    expect(canRemoveMember('admin', 'member')).toBe(true);
    expect(canRemoveMember('admin', 'admin')).toBe(false);
    expect(canRemoveMember('admin', 'owner')).toBe(false);
    expect(canRemoveMember('member', 'member')).toBe(false);
  });
});

describe('BR-02 eligibility', () => {
  const rules = [
    { jobRole: 'developer', productId: 'ide-pro' },
    { jobRole: 'developer', productId: 'office' },
    { jobRole: 'accountant', productId: 'office' },
  ];

  it('requires an active employee and a matching rule', () => {
    expect(isEligible({ status: 'active', jobRole: 'developer' }, rules, 'ide-pro')).toBe(true);
    expect(isEligible({ status: 'terminated', jobRole: 'developer' }, rules, 'ide-pro')).toBe(false);
    expect(isEligible({ status: 'active', jobRole: 'designer' }, rules, 'ide-pro')).toBe(false);
  });

  it('lists every product a job role is entitled to', () => {
    expect(eligibleProductIds({ status: 'active', jobRole: 'developer' }, rules)).toEqual(['ide-pro', 'office']);
    expect(eligibleProductIds({ status: 'terminated', jobRole: 'developer' }, rules)).toEqual([]);
  });

  it('explains a loss of eligibility caused by the employee change', () => {
    expect(lossReasonForEmployee({ status: 'terminated', jobRole: 'developer' })).toBe('EMPLOYEE_TERMINATED');
    expect(lossReasonForEmployee({ status: 'active', jobRole: 'accountant' })).toBe('ROLE_NO_LONGER_ELIGIBLE');
  });
});
