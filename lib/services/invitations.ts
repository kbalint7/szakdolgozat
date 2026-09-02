import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTx, type Tx } from '@/db/drizzle';
import { companies, employees, invitations, memberships, users, type Employee } from '@/db/schema';
import { randomToken, sha256 } from '@/lib/crypto';
import { DomainError, isUniqueViolation } from '@/lib/errors';

import { audit, type Actor } from './audit';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export function invitationStatus(
  invitation: { acceptedAt: Date | null; declinedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now = new Date(),
): InvitationStatus {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.revokedAt) return 'revoked';
  if (invitation.declinedAt) return 'declined';
  if (invitation.expiresAt <= now) return 'expired';
  return 'pending';
}

function newToken(now: Date) {
  const token = randomToken(32);
  return { token, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + INVITATION_TTL_MS) };
}

function pendingCondition(now: Date) {
  return and(
    isNull(invitations.acceptedAt),
    isNull(invitations.declinedAt),
    isNull(invitations.revokedAt),
    gt(invitations.expiresAt, now),
  );
}

async function memberByEmail(tx: DbOrTx, companyId: string, email: string) {
  const [row] = await tx
    .select({ membershipId: memberships.id, userId: users.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.companyId, companyId), eq(sql`lower(${users.email})`, email.toLowerCase())));
  return row ?? null;
}

export async function createInvitation(
  actor: Actor & { type: 'user' },
  companyId: string,
  input: { email: string; role: 'admin' | 'member' },
) {
  const now = new Date();
  const email = input.email.toLowerCase();
  return db.transaction(async tx => {
    if (await memberByEmail(tx, companyId, email)) throw new DomainError('ALREADY_MEMBER');
    const [pending] = await tx
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.companyId, companyId), eq(invitations.email, email), pendingCondition(now)));
    if (pending) throw new DomainError('INVITATION_PENDING');

    const [employee] = await tx
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(sql`lower(${employees.email})`, email),
          isNull(employees.membershipId),
        ),
      );

    const { token, tokenHash, expiresAt } = newToken(now);
    const [invitation] = await tx
      .insert(invitations)
      .values({
        companyId,
        email,
        role: input.role,
        tokenHash,
        expiresAt,
        invitedBy: actor.id,
        employeeId: employee?.id,
      })
      .returning();
    await audit(tx, {
      companyId,
      actor,
      action: 'invitation.created',
      targetType: 'invitation',
      targetId: invitation.id,
      employeeId: employee?.id,
      data: { email, role: input.role },
    });
    return { invitation, token };
  });
}

export async function onEmployeeHired(
  tx: Tx,
  {
    companyId,
    employee,
    actor,
    causeEventId,
  }: { companyId: string; employee: Employee; actor: Actor; causeEventId: string },
) {
  if (!employee.email || employee.membershipId) return;
  const email = employee.email.toLowerCase();
  const now = new Date();

  const member = await memberByEmail(tx, companyId, email);
  if (member) {
    const [alreadyLinked] = await tx
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.membershipId, member.membershipId));
    if (alreadyLinked) return;
    await tx.update(employees).set({ membershipId: member.membershipId }).where(eq(employees.id, employee.id));
    await audit(tx, {
      companyId,
      actor,
      action: 'membership.linked',
      targetType: 'membership',
      targetId: member.membershipId,
      employeeId: employee.id,
      causeEventId,
      data: { userId: member.userId, via: 'hr_email' },
    });
    return;
  }

  const [pending] = await tx
    .select({ id: invitations.id, employeeId: invitations.employeeId })
    .from(invitations)
    .where(and(eq(invitations.companyId, companyId), eq(invitations.email, email), pendingCondition(now)));
  if (pending) {
    if (!pending.employeeId) {
      await tx.update(invitations).set({ employeeId: employee.id }).where(eq(invitations.id, pending.id));
    }
    return;
  }

  const { tokenHash, expiresAt } = newToken(now);
  const [invitation] = await tx
    .insert(invitations)
    .values({ companyId, email, role: 'member', tokenHash, expiresAt, employeeId: employee.id })
    .returning({ id: invitations.id });
  await audit(tx, {
    companyId,
    actor,
    action: 'invitation.created',
    targetType: 'invitation',
    targetId: invitation.id,
    employeeId: employee.id,
    causeEventId,
    data: { email, role: 'member', via: 'hr_event' },
  });
}

export async function regenerateInvitationLink(actor: Actor, companyId: string, invitationId: string) {
  const now = new Date();
  return db.transaction(async tx => {
    const { token, tokenHash, expiresAt } = newToken(now);
    const [invitation] = await tx
      .update(invitations)
      .set({ tokenHash, expiresAt })
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.companyId, companyId),
          isNull(invitations.acceptedAt),
          isNull(invitations.declinedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .returning({ id: invitations.id, email: invitations.email });
    if (!invitation) throw new DomainError('INVITATION_INVALID');
    await audit(tx, {
      companyId,
      actor,
      action: 'invitation.link_regenerated',
      targetType: 'invitation',
      targetId: invitation.id,
      data: { email: invitation.email },
    });
    return { token };
  });
}

export async function revokeInvitation(actor: Actor, companyId: string, invitationId: string) {
  await db.transaction(async tx => {
    const [invitation] = await tx
      .update(invitations)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.companyId, companyId),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .returning({ id: invitations.id, email: invitations.email });
    if (!invitation) throw new DomainError('INVITATION_INVALID');
    await audit(tx, {
      companyId,
      actor,
      action: 'invitation.revoked',
      targetType: 'invitation',
      targetId: invitation.id,
      data: { email: invitation.email },
    });
  });
}

export async function listInvitations(companyId: string) {
  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      declinedAt: invitations.declinedAt,
      revokedAt: invitations.revokedAt,
      invitedBy: users.name,
      employee: { id: employees.id, hrId: employees.hrId },
    })
    .from(invitations)
    .leftJoin(users, eq(users.id, invitations.invitedBy))
    .leftJoin(employees, eq(employees.id, invitations.employeeId))
    .where(eq(invitations.companyId, companyId))
    .orderBy(desc(invitations.createdAt))
    .limit(100);
  const now = new Date();
  return rows.map(row => ({
    ...row,
    employee: row.employee?.id ? row.employee : null,
    status: invitationStatus(row, now),
  }));
}

export async function getInvitationByToken(token: string) {
  const [row] = await db
    .select({
      invitation: invitations,
      companyName: companies.name,
      companyDeletedAt: companies.deletedAt,
      invitedBy: users.name,
    })
    .from(invitations)
    .innerJoin(companies, eq(companies.id, invitations.companyId))
    .leftJoin(users, eq(users.id, invitations.invitedBy))
    .where(eq(invitations.tokenHash, sha256(token)));
  if (!row || row.companyDeletedAt) return null;
  return {
    ...row.invitation,
    companyName: row.companyName,
    invitedBy: row.invitedBy,
    status: invitationStatus(row.invitation),
  };
}

const statusErrors: Record<Exclude<InvitationStatus, 'pending'>, string> = {
  accepted: 'INVITATION_USED',
  declined: 'INVITATION_USED',
  revoked: 'INVITATION_REVOKED',
  expired: 'INVITATION_EXPIRED',
};

async function lockPendingInvitation(tx: Tx, token: string, user: { email: string }) {
  const [invitation] = await tx
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, sha256(token)))
    .for('update');
  if (!invitation) throw new DomainError('INVITATION_INVALID');
  const status = invitationStatus(invitation);
  if (status !== 'pending') throw new DomainError(statusErrors[status]);
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) throw new DomainError('INVITATION_EMAIL_MISMATCH');
  return invitation;
}

export async function acceptInvitation(user: { id: string; email: string }, token: string) {
  return db.transaction(async tx => {
    const invitation = await lockPendingInvitation(tx, token, user);
    const actor: Actor = { type: 'user', id: user.id };
    let membershipId: string;
    try {
      [{ id: membershipId }] = await tx
        .insert(memberships)
        .values({ companyId: invitation.companyId, userId: user.id, role: invitation.role })
        .returning({ id: memberships.id });
    } catch (error) {
      if (isUniqueViolation(error, 'memberships_company_user_unique')) throw new DomainError('ALREADY_MEMBER');
      throw error;
    }
    await tx
      .update(invitations)
      .set({ acceptedAt: new Date(), acceptedBy: user.id })
      .where(eq(invitations.id, invitation.id));

    let linkedEmployeeId: string | null = null;
    if (invitation.employeeId) {
      const [linked] = await tx
        .update(employees)
        .set({ membershipId })
        .where(and(eq(employees.id, invitation.employeeId), isNull(employees.membershipId)))
        .returning({ id: employees.id });
      linkedEmployeeId = linked?.id ?? null;
    }

    await audit(
      tx,
      {
        companyId: invitation.companyId,
        actor,
        action: 'invitation.accepted',
        targetType: 'invitation',
        targetId: invitation.id,
        employeeId: linkedEmployeeId,
        data: { email: invitation.email },
      },
      {
        companyId: invitation.companyId,
        actor,
        action: 'membership.created',
        targetType: 'membership',
        targetId: membershipId,
        employeeId: linkedEmployeeId,
        data: { userId: user.id, role: invitation.role, via: 'invitation' },
      },
      ...(linkedEmployeeId
        ? [
            {
              companyId: invitation.companyId,
              actor,
              action: 'membership.linked',
              targetType: 'membership',
              targetId: membershipId,
              employeeId: linkedEmployeeId,
              data: { userId: user.id, via: 'invitation' },
            },
          ]
        : []),
    );
    return { companyId: invitation.companyId, membershipId, linkedEmployeeId };
  });
}

export async function declineInvitation(user: { id: string; email: string }, token: string) {
  await db.transaction(async tx => {
    const invitation = await lockPendingInvitation(tx, token, user);
    await tx.update(invitations).set({ declinedAt: new Date() }).where(eq(invitations.id, invitation.id));
    await audit(tx, {
      companyId: invitation.companyId,
      actor: { type: 'user', id: user.id },
      action: 'invitation.declined',
      targetType: 'invitation',
      targetId: invitation.id,
      data: { email: invitation.email },
    });
  });
}

export async function linkMemberToEmployee(actor: Actor, companyId: string, employeeId: string, membershipId: string) {
  try {
    await db.transaction(async tx => {
      const [employee] = await tx
        .select()
        .from(employees)
        .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
        .for('update');
      if (!employee) throw new DomainError('EMPLOYEE_NOT_FOUND');
      if (employee.membershipId) throw new DomainError('EMPLOYEE_ALREADY_LINKED');
      const [membership] = await tx
        .select({ id: memberships.id, userId: memberships.userId })
        .from(memberships)
        .where(and(eq(memberships.id, membershipId), eq(memberships.companyId, companyId)));
      if (!membership) throw new DomainError('MEMBER_NOT_FOUND');
      await tx.update(employees).set({ membershipId }).where(eq(employees.id, employeeId));
      await audit(tx, {
        companyId,
        actor,
        action: 'membership.linked',
        targetType: 'membership',
        targetId: membershipId,
        employeeId,
        data: { userId: membership.userId, via: 'manual' },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new DomainError('MEMBERSHIP_ALREADY_LINKED');
    throw error;
  }
}

export async function unlinkEmployee(actor: Actor, companyId: string, employeeId: string) {
  await db.transaction(async tx => {
    const [employee] = await tx
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)))
      .for('update');
    if (!employee) throw new DomainError('EMPLOYEE_NOT_FOUND');
    if (!employee.membershipId) return;
    await tx.update(employees).set({ membershipId: null }).where(eq(employees.id, employeeId));
    await audit(tx, {
      companyId,
      actor,
      action: 'membership.unlinked',
      targetType: 'membership',
      targetId: employee.membershipId,
      employeeId,
      data: { via: 'manual' },
    });
  });
}

export async function listUnlinkedMembers(companyId: string) {
  return db
    .select({ membershipId: memberships.id, name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .leftJoin(employees, eq(employees.membershipId, memberships.id))
    .where(and(eq(memberships.companyId, companyId), isNull(employees.id)))
    .orderBy(users.name);
}
