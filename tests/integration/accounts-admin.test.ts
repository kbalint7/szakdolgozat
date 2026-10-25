import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { memberships, orders, users } from '@/db/schema';
import { requireApiKey } from '@/lib/api/auth';
import { createApiKey } from '@/lib/services/api-keys';
import {
  deleteAccount,
  findMembership,
  leaveCompany,
  setMemberRole,
  transferOwnership,
} from '@/lib/services/companies';
import { activateLicenseKey, issueManualKey } from '@/lib/services/orders';

import { createProductWithPlan, createTestCompany, createUser } from './fixtures';

const request = (token?: string) =>
  new Request('http://localhost/api/v1/hr/events', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

describe('KEY-2: API key scopes', () => {
  it('a key without hr:events:write gets 403, a missing or unknown key 401', async () => {
    const test = await createTestCompany();
    const readOnly = await createApiKey(test.ownerActor, test.company.id, { name: 'ro', scopes: ['hr:events:read'] });

    const forbidden = await requireApiKey(request(readOnly.token), 'hr:events:write');
    expect('response' in forbidden && forbidden.response.status).toBe(403);
    const allowed = await requireApiKey(request(readOnly.token), 'hr:events:read');
    expect('key' in allowed && allowed.key.companyId).toBe(test.company.id);

    const missing = await requireApiKey(request(), 'hr:events:read');
    expect('response' in missing && missing.response.status).toBe(401);
    const unknown = await requireApiKey(request('lm_live_deadbeef_' + 'x'.repeat(43)), 'hr:events:read');
    expect('response' in unknown && unknown.response.status).toBe(401);
  });
});

describe('ADM-4: manual licence keys', () => {
  it('appear as manual orders without a company and can be activated by any company', async () => {
    const { plan, admin } = await createProductWithPlan(3);
    const { orderId, licenseKey } = await issueManualKey({ type: 'user', id: admin.id }, plan.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    expect(order).toMatchObject({ source: 'manual', companyId: null, priceHuf: plan.priceHuf });

    const test = await createTestCompany();
    const { license } = await activateLicenseKey(test.ownerActor, test.company.id, licenseKey);
    expect(license.seatCount).toBe(3);
  });
});

describe('AUTH-4, COMP-6, COMP-7: accounts and ownership', () => {
  async function companyWithAdmin() {
    const test = await createTestCompany();
    const admin = await createUser('Admin');
    const [membership] = await db
      .insert(memberships)
      .values({ companyId: test.company.id, userId: admin.id, role: 'admin' })
      .returning();
    return { test, admin, membership };
  }

  it('the owner cannot leave (BR-13) or delete the account while owning a company', async () => {
    const { test } = await companyWithAdmin();
    await expect(leaveCompany(test.owner.id, test.company.id)).rejects.toMatchObject({ code: 'OWNER_CANNOT_LEAVE' });
    await expect(deleteAccount(test.owner.id)).rejects.toMatchObject({ code: 'USER_OWNS_COMPANY' });
  });

  it('ownership transfer keeps exactly one owner; the old owner becomes admin and may then leave', async () => {
    const { test, admin, membership } = await companyWithAdmin();
    await transferOwnership(test.owner.id, test.company.id, membership.id);
    expect((await findMembership(test.company.id, admin.id))?.role).toBe('owner');
    expect((await findMembership(test.company.id, test.owner.id))?.role).toBe('admin');
    const owners = await db.select().from(memberships).where(eq(memberships.role, 'owner'));
    expect(owners.filter(m => m.companyId === test.company.id)).toHaveLength(1);

    await leaveCompany(test.owner.id, test.company.id);
    expect(await findMembership(test.company.id, test.owner.id)).toBeNull();
  });

  it('only a non-owner can be demoted; an account without ownership can be deleted', async () => {
    const { test, admin, membership } = await companyWithAdmin();
    await setMemberRole(test.ownerActor, test.company.id, membership.id, 'member');
    expect((await findMembership(test.company.id, admin.id))?.role).toBe('member');

    await deleteAccount(admin.id);
    expect(await db.select().from(users).where(eq(users.id, admin.id))).toEqual([]);
    expect(await findMembership(test.company.id, admin.id)).toBeNull();
  });
});
