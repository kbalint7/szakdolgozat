import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db/drizzle';
import { invitations, licenseKeys, memberships, orders } from '@/db/schema';
import { sha256 } from '@/lib/crypto';
import { activateLicenseKey, purchasePlan, revokeLicenseKey } from '@/lib/services/orders';
import {
  acceptInvitation,
  createInvitation,
  getInvitationByToken,
  regenerateInvitationLink,
} from '@/lib/services/invitations';

import { createProductWithPlan, createTestCompany, createUser, employeeByHrId, poolState } from './fixtures';

describe('purchase and activation', () => {
  it('ORD-1: stores a paid order with the price snapshot and only the hash of the key', async () => {
    const { plan } = await createProductWithPlan(5);
    const test = await createTestCompany();
    const result = await purchasePlan(test.ownerActor, test.company.id, plan.id);
    expect(result.licenseKey).toMatch(/^LK-[0-9A-Z]{5}(-[0-9A-Z]{5}){3}$/);

    const [order] = await db.select().from(orders).where(eq(orders.id, result.orderId));
    expect(order).toMatchObject({ priceHuf: plan.priceHuf, source: 'purchase', companyId: test.company.id });
    const [key] = await db.select().from(licenseKeys).where(eq(licenseKeys.orderId, order.id));
    expect(key.keyHash).toBe(sha256(result.licenseKey));
    expect(key.keyLast4).toBe(result.licenseKey.slice(-4));
    expect(JSON.stringify(key)).not.toContain(result.licenseKey);
  });

  it('ORD-2 / BR-14: activation creates the licence and fills the waitlist; a key works once', async () => {
    const { product, plan } = await createProductWithPlan(2);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.hire('E-1');
    await test.hire('E-2');
    expect((await poolState(test.company.id, product.id)).waiting).toEqual(['E-1', 'E-2']);

    const { licenseKey } = await purchasePlan(test.ownerActor, test.company.id, plan.id);
    const { license } = await activateLicenseKey(test.ownerActor, test.company.id, ` ${licenseKey.toLowerCase()} `);
    expect(license.seatCount).toBe(2);
    expect(license.validUntil!.getTime() - license.validFrom.getTime()).toBe(365 * 24 * 60 * 60 * 1000);
    expect((await poolState(test.company.id, product.id)).assigned).toEqual(['E-1', 'E-2']);

    const other = await createTestCompany('Másik');
    await expect(activateLicenseKey(other.ownerActor, other.company.id, licenseKey)).rejects.toMatchObject({
      code: 'LICENSE_KEY_USED',
    });
    await expect(activateLicenseKey(test.ownerActor, test.company.id, 'LK-NOPE')).rejects.toMatchObject({
      code: 'LICENSE_KEY_UNKNOWN',
    });
  });

  it('a revoked key cannot be activated', async () => {
    const { plan } = await createProductWithPlan(2);
    const test = await createTestCompany();
    const { licenseKey } = await purchasePlan(test.ownerActor, test.company.id, plan.id);
    const [key] = await db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.keyHash, sha256(licenseKey)));
    await revokeLicenseKey(test.ownerActor, key.id);
    await expect(activateLicenseKey(test.ownerActor, test.company.id, licenseKey)).rejects.toMatchObject({
      code: 'LICENSE_KEY_REVOKED',
    });
  });

  it('a deactivated plan cannot be bought', async () => {
    const { plan, admin } = await createProductWithPlan(2);
    const { setPlanActive } = await import('@/lib/services/catalog');
    await setPlanActive({ type: 'user', id: admin.id }, plan.id, false);
    const test = await createTestCompany();
    await expect(purchasePlan(test.ownerActor, test.company.id, plan.id)).rejects.toMatchObject({
      code: 'PLAN_INACTIVE',
    });
  });
});

describe('invitations', () => {
  it('COMP-4/5: a single-use token; accepting creates the membership', async () => {
    const test = await createTestCompany();
    const invitee = await createUser('Meghívott');
    const { token } = await createInvitation(test.ownerActor, test.company.id, {
      email: invitee.email,
      role: 'member',
    });
    const [stored] = await db.select().from(invitations).where(eq(invitations.companyId, test.company.id));
    expect(stored.tokenHash).toBe(sha256(token));

    const stranger = await createUser('Idegen');
    await expect(acceptInvitation(stranger, token)).rejects.toMatchObject({ code: 'INVITATION_EMAIL_MISMATCH' });

    await acceptInvitation(invitee, token);
    const [membership] = await db.select().from(memberships).where(eq(memberships.userId, invitee.id));
    expect(membership).toMatchObject({ companyId: test.company.id, role: 'member' });
    await expect(acceptInvitation(invitee, token)).rejects.toMatchObject({ code: 'INVITATION_USED' });
  });

  it('an expired invitation cannot be accepted', async () => {
    const test = await createTestCompany();
    const invitee = await createUser();
    const { token, invitation } = await createInvitation(test.ownerActor, test.company.id, {
      email: invitee.email,
      role: 'member',
    });
    await db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(invitations.id, invitation.id));
    expect((await getInvitationByToken(token))?.status).toBe('expired');
    await expect(acceptInvitation(invitee, token)).rejects.toMatchObject({ code: 'INVITATION_EXPIRED' });
  });

  it('EMP-4: a hire with an email invites the employee; accepting links the membership', async () => {
    const { product, plan } = await createProductWithPlan(5);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.license(plan.id);
    const user = await createUser('Kiss Anna');
    await test.hire('E-1', 'developer', { email: user.email });

    const [invitation] = await db.select().from(invitations).where(eq(invitations.companyId, test.company.id));
    expect(invitation).toMatchObject({ email: user.email, role: 'member', invitedBy: null });
    const employee = await employeeByHrId(test.company.id, 'E-1');
    expect(invitation.employeeId).toBe(employee.id);

    const { token } = await regenerateInvitationLink(test.ownerActor, test.company.id, invitation.id);
    const { linkedEmployeeId } = await acceptInvitation(user, token);
    expect(linkedEmployeeId).toBe(employee.id);
    expect((await employeeByHrId(test.company.id, 'E-1')).membershipId).not.toBeNull();
  });
});
