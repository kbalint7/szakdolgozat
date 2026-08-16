import { and, asc, count, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, type Tx } from '@/db/drizzle';
import {
  apiKeys,
  companies,
  employees,
  invitations,
  licenses,
  memberships,
  seatAssignments,
  users,
  type Company,
  type MembershipRole,
} from '@/db/schema';
import { canRemoveMember } from '@/lib/domain/permissions';
import { DomainError } from '@/lib/errors';
import type { CompanyInput } from '@/lib/validation/company';

import { audit, type Actor } from './audit';

export type CompanyMembership = {
  membershipId: string;
  role: MembershipRole;
  company: Pick<Company, 'id' | 'name' | 'description' | 'createdAt'>;
};

export async function findMembership(companyId: string, userId: string): Promise<CompanyMembership | null> {
  const [row] = await db
    .select({
      membershipId: memberships.id,
      role: memberships.role,
      company: {
        id: companies.id,
        name: companies.name,
        description: companies.description,
        createdAt: companies.createdAt,
      },
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(and(eq(memberships.companyId, companyId), eq(memberships.userId, userId), isNull(companies.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function listMyCompanies(userId: string) {
  const memberCounts = db
    .select({ companyId: memberships.companyId, memberCount: count().as('member_count') })
    .from(memberships)
    .groupBy(memberships.companyId)
    .as('member_counts');

  return db
    .select({
      id: companies.id,
      name: companies.name,
      description: companies.description,
      role: memberships.role,
      memberCount: sql<number>`coalesce(${memberCounts.memberCount}, 0)`.mapWith(Number),
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .leftJoin(memberCounts, eq(memberCounts.companyId, companies.id))
    .where(and(eq(memberships.userId, userId), isNull(companies.deletedAt)))
    .orderBy(asc(companies.name));
}

export async function createCompany(userId: string, input: CompanyInput): Promise<Company> {
  return db.transaction(async tx => {
    const [company] = await tx.insert(companies).values(input).returning();
    const [membership] = await tx
      .insert(memberships)
      .values({ companyId: company.id, userId, role: 'owner' })
      .returning();
    const actor: Actor = { type: 'user', id: userId };
    await audit(
      tx,
      { companyId: company.id, actor, action: 'company.created', targetType: 'company', targetId: company.id },
      {
        companyId: company.id,
        actor,
        action: 'membership.created',
        targetType: 'membership',
        targetId: membership.id,
        data: { userId, role: 'owner' },
      },
    );
    return company;
  });
}

export async function updateCompany(actor: Actor, companyId: string, input: CompanyInput) {
  await db.transaction(async tx => {
    const [company] = await tx
      .update(companies)
      .set(input)
      .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
      .returning({ id: companies.id });
    if (!company) throw new DomainError('COMPANY_NOT_FOUND');
    await audit(tx, {
      companyId,
      actor,
      action: 'company.updated',
      targetType: 'company',
      targetId: companyId,
      data: { ...input },
    });
  });
}

export async function deleteCompany(actor: Actor, companyId: string, confirmation: string) {
  await db.transaction(async tx => {
    const [company] = await tx
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
      .for('update');
    if (!company) throw new DomainError('COMPANY_NOT_FOUND');
    if (confirmation.trim() !== company.name.trim()) throw new DomainError('CONFIRMATION_MISMATCH');

    const now = new Date();
    const ended = await tx
      .update(seatAssignments)
      .set({
        status: sql`case when ${seatAssignments.status} = 'assigned' then 'revoked'::seat_status else 'cancelled'::seat_status end`,
        endedAt: now,
        endReason: 'COMPANY_DELETED',
      })
      .where(and(eq(seatAssignments.companyId, companyId), inArray(seatAssignments.status, ['waiting', 'assigned'])))
      .returning({
        id: seatAssignments.id,
        employeeId: seatAssignments.employeeId,
        productId: seatAssignments.productId,
        status: seatAssignments.status,
      });
    await tx
      .update(apiKeys)
      .set({ revokedAt: now })
      .where(and(eq(apiKeys.companyId, companyId), isNull(apiKeys.revokedAt)));
    await tx
      .update(invitations)
      .set({ revokedAt: now })
      .where(and(eq(invitations.companyId, companyId), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));
    await tx.update(companies).set({ deletedAt: now }).where(eq(companies.id, companyId));

    await audit(
      tx,
      { companyId, actor, action: 'company.deleted', targetType: 'company', targetId: companyId },
      ...ended.map(seat => ({
        companyId,
        actor,
        action: seat.status === 'revoked' ? 'seat.revoked' : 'seat.cancelled',
        targetType: 'seat_assignment',
        targetId: seat.id,
        reason: 'COMPANY_DELETED',
        employeeId: seat.employeeId,
        data: { productId: seat.productId },
      })),
    );
  });
}

export async function listMembers(companyId: string) {
  return db
    .select({
      membershipId: memberships.id,
      role: memberships.role,
      joinedAt: memberships.createdAt,
      user: { id: users.id, name: users.name, email: users.email },
      employee: { id: employees.id, hrId: employees.hrId, name: employees.name },
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .leftJoin(employees, eq(employees.membershipId, memberships.id))
    .where(eq(memberships.companyId, companyId))
    .orderBy(sql`case ${memberships.role} when 'owner' then 0 when 'admin' then 1 else 2 end`, asc(users.name));
}

async function lockMembership(tx: Tx, companyId: string, id: string) {
  const [membership] = await tx
    .select()
    .from(memberships)
    .where(and(eq(memberships.id, id), eq(memberships.companyId, companyId)))
    .for('update');
  if (!membership) throw new DomainError('MEMBER_NOT_FOUND');
  return membership;
}

export async function removeMember(actor: Actor, actorRole: MembershipRole, companyId: string, membershipId: string) {
  await db.transaction(async tx => {
    const target = await lockMembership(tx, companyId, membershipId);
    if (target.role === 'owner') throw new DomainError('CANNOT_REMOVE_OWNER');
    if (!canRemoveMember(actorRole, target.role)) throw new DomainError('CANNOT_REMOVE_ADMIN');
    const [linked] = await tx
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.membershipId, membershipId));
    await tx.delete(memberships).where(eq(memberships.id, membershipId));
    await audit(tx, {
      companyId,
      actor,
      action: 'membership.removed',
      targetType: 'membership',
      targetId: membershipId,
      employeeId: linked?.id,
      data: { userId: target.userId, role: target.role, unlinkedEmployeeId: linked?.id ?? null },
    });
  });
}

export async function leaveCompany(userId: string, companyId: string) {
  await db.transaction(async tx => {
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.companyId, companyId), eq(memberships.userId, userId)))
      .for('update');
    if (!membership) throw new DomainError('MEMBER_NOT_FOUND');
    if (membership.role === 'owner') throw new DomainError('OWNER_CANNOT_LEAVE');
    const [linked] = await tx
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.membershipId, membership.id));
    await tx.delete(memberships).where(eq(memberships.id, membership.id));
    await audit(tx, {
      companyId,
      actor: { type: 'user', id: userId },
      action: 'membership.left',
      targetType: 'membership',
      targetId: membership.id,
      employeeId: linked?.id,
      data: { role: membership.role, unlinkedEmployeeId: linked?.id ?? null },
    });
  });
}

export async function setMemberRole(actor: Actor, companyId: string, membershipId: string, role: 'admin' | 'member') {
  await db.transaction(async tx => {
    const target = await lockMembership(tx, companyId, membershipId);
    if (target.role === 'owner') throw new DomainError('ALREADY_OWNER');
    if (target.role === role) return;
    await tx.update(memberships).set({ role }).where(eq(memberships.id, membershipId));
    await audit(tx, {
      companyId,
      actor,
      action: 'membership.role_changed',
      targetType: 'membership',
      targetId: membershipId,
      data: { userId: target.userId, from: target.role, to: role },
    });
  });
}

export async function transferOwnership(ownerUserId: string, companyId: string, membershipId: string) {
  await db.transaction(async tx => {
    const target = await lockMembership(tx, companyId, membershipId);
    if (target.role === 'owner') throw new DomainError('ALREADY_OWNER');
    const [current] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.companyId, companyId), eq(memberships.role, 'owner')))
      .for('update');
    if (!current || current.userId !== ownerUserId) throw new DomainError('FORBIDDEN');
    await tx.update(memberships).set({ role: 'admin' }).where(eq(memberships.id, current.id));
    await tx.update(memberships).set({ role: 'owner' }).where(eq(memberships.id, target.id));
    await audit(tx, {
      companyId,
      actor: { type: 'user', id: ownerUserId },
      action: 'company.ownership_transferred',
      targetType: 'membership',
      targetId: target.id,
      data: { fromUserId: ownerUserId, toUserId: target.userId },
    });
  });
}

export async function updateProfileName(userId: string, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function deleteAccount(userId: string) {
  await db.transaction(async tx => {
    const [owned] = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .innerJoin(companies, eq(companies.id, memberships.companyId))
      .where(and(eq(memberships.userId, userId), eq(memberships.role, 'owner'), isNull(companies.deletedAt)))
      .limit(1);
    if (owned) throw new DomainError('USER_OWNS_COMPANY');

    const userMemberships = await tx
      .select({ id: memberships.id, companyId: memberships.companyId, role: memberships.role })
      .from(memberships)
      .where(eq(memberships.userId, userId));
    await audit(
      tx,
      ...userMemberships.map(m => ({
        companyId: m.companyId,
        actor: { type: 'user' as const, id: userId },
        action: 'membership.removed',
        targetType: 'membership',
        targetId: m.id,
        reason: 'ACCOUNT_DELETED',
        data: { role: m.role },
      })),
    );
    await tx.delete(users).where(eq(users.id, userId));
  });
}

export async function listAllCompanies() {
  const owners = db
    .select({ companyId: memberships.companyId, ownerName: users.name, ownerEmail: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.role, 'owner'))
    .as('owners');

  return db
    .select({
      id: companies.id,
      name: companies.name,
      createdAt: companies.createdAt,
      deletedAt: companies.deletedAt,
      ownerName: owners.ownerName,
      ownerEmail: owners.ownerEmail,
      members: sql<number>`(select count(*) from ${memberships} m where m.company_id = ${companies.id})`.mapWith(
        Number,
      ),
      employees:
        sql<number>`(select count(*) from ${employees} e where e.company_id = ${companies.id} and e.status = 'active')`.mapWith(
          Number,
        ),
      licenses:
        sql<number>`(select count(*) from ${licenses} l where l.company_id = ${companies.id} and l.status = 'active')`.mapWith(
          Number,
        ),
    })
    .from(companies)
    .leftJoin(owners, eq(owners.companyId, companies.id))
    .orderBy(sql`${companies.deletedAt} is not null`, companies.name);
}
