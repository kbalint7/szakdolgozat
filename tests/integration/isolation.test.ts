import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { employees, hrEvents } from '@/db/schema';
import { can } from '@/lib/domain/permissions';
import { authenticateApiKey, revokeApiKey } from '@/lib/services/api-keys';
import { deleteCompany, findMembership } from '@/lib/services/companies';
import { getEmployee, listEmployees } from '@/lib/services/employees';
import { listHrEvents } from '@/lib/services/hr-events';
import { checkLicense } from '@/lib/services/license-check';
import { listRulesWithImpact } from '@/lib/services/rules';

import { createProductWithPlan, createTestCompany, employeeByHrId, linkedUser, poolState } from './fixtures';

describe('S10: company A cannot see or change company B', () => {
  it('A user of A has no membership in B, so B pages are 404s', async () => {
    const a = await createTestCompany('A Kft.');
    const b = await createTestCompany('B Kft.');
    expect(await findMembership(b.company.id, a.owner.id)).toBeNull();
    expect(await findMembership(a.company.id, a.owner.id)).not.toBeNull();
  });

  it("company-scoped queries never return another company's rows", async () => {
    const { product, plan } = await createProductWithPlan(5);
    const a = await createTestCompany('A Kft.');
    const b = await createTestCompany('B Kft.');
    await b.rule('developer', product.id);
    await b.license(plan.id);
    await b.hire('B-1');

    const bEmployee = await employeeByHrId(b.company.id, 'B-1');
    expect(await getEmployee(a.company.id, bEmployee.id)).toBeNull();
    expect(await listEmployees(a.company.id)).toEqual([]);
    expect(await listRulesWithImpact(a.company.id)).toEqual([]);
    expect(await listHrEvents(a.company.id, undefined)).toEqual([]);
  });

  it("A's API key only ever writes A, even with B's identifiers", async () => {
    const a = await createTestCompany('A Kft.');
    const b = await createTestCompany('B Kft.');
    await b.hire('SHARED-ID');
    const key = await authenticateApiKey(a.apiKey.token);
    expect(key?.companyId).toBe(a.company.id);

    await a.terminate('SHARED-ID');
    expect((await employeeByHrId(b.company.id, 'SHARED-ID')).status).toBe('active');
    expect((await employeeByHrId(a.company.id, 'SHARED-ID')).status).toBe('terminated');
    const events = await db.select().from(hrEvents).where(eq(hrEvents.hrId, 'SHARED-ID'));
    expect(events.map(event => event.companyId).sort()).toEqual([a.company.id, b.company.id].sort());
  });

  it('a user of A checking a product only B licensed is denied', async () => {
    const { product, plan } = await createProductWithPlan(5);
    const a = await createTestCompany('A Kft.');
    const b = await createTestCompany('B Kft.');
    await b.rule('developer', product.id);
    await b.license(plan.id);
    await a.hire('A-1');
    const aUser = await linkedUser(a, 'A-1');
    const result = await aUser.check(product.slug);
    expect(result.found && result.decision).toMatchObject({ allowed: false, reason: 'NOT_ELIGIBLE' });
  });

  it('KEY-1: a revoked API key is rejected on its next use', async () => {
    const a = await createTestCompany();
    expect(await authenticateApiKey(a.apiKey.token)).not.toBeNull();
    await revokeApiKey(a.ownerActor, a.company.id, a.apiKey.id);
    expect(await authenticateApiKey(a.apiKey.token)).toBeNull();
  });

  it('a key of another company cannot be revoked through this company', async () => {
    const a = await createTestCompany('A Kft.');
    const b = await createTestCompany('B Kft.');
    await expect(revokeApiKey(a.ownerActor, a.company.id, b.apiKey.id)).rejects.toMatchObject({
      code: 'API_KEY_NOT_FOUND',
    });
  });
});

describe('BR-19: deleting a company', () => {
  it('revokes every seat, the API keys and invitations; the company disappears for members', async () => {
    const { product, plan } = await createProductWithPlan(2);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.license(plan.id);
    await test.hire('E-1');
    await test.hire('E-2');
    await test.hire('E-3');
    const user = await linkedUser(test, 'E-1');

    await expect(deleteCompany(test.ownerActor, test.company.id, 'rossz név')).rejects.toMatchObject({
      code: 'CONFIRMATION_MISMATCH',
    });
    await deleteCompany(test.ownerActor, test.company.id, test.company.name);

    expect(await poolState(test.company.id, product.id)).toMatchObject({ assigned: [], waiting: [] });
    expect(await authenticateApiKey(test.apiKey.token)).toBeNull();
    expect(await findMembership(test.company.id, test.owner.id)).toBeNull();
    const result = await checkLicense({ userId: user.user.id }, product.slug);
    expect(result.found && result.decision).toMatchObject({ allowed: false, reason: 'NOT_MEMBER' });
    expect(await db.select().from(employees).where(eq(employees.companyId, test.company.id))).toHaveLength(3);
  });
});

describe('§2.3 permission matrix as enforced by the services', () => {
  it('only the owner may change roles; admins may invite', () => {
    expect(can('admin', 'members.changeRole')).toBe(false);
    expect(can('admin', 'members.invite')).toBe(true);
    expect(can('member', 'rules.manage')).toBe(false);
  });
});
