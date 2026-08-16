import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';

import { can, type CompanyAction, type Role } from '@/lib/domain/permissions';
import { DomainError } from '@/lib/errors';
import type { Actor } from '@/lib/services/audit';
import { findMembership, type CompanyMembership } from '@/lib/services/companies';
import { isUuid } from '@/lib/validation/ids';

import { requireUser, type SessionUser } from './session';

export type CompanyContext = CompanyMembership & {
  user: SessionUser;
  actor: Actor;
  can: (action: CompanyAction) => boolean;
};

export const getCompanyContext = cache(async (companyId: string): Promise<CompanyContext> => {
  const user = await requireUser();
  const membership = isUuid(companyId) ? await findMembership(companyId, user.id) : null;
  if (!membership) notFound();
  return {
    ...membership,
    user,
    actor: { type: 'user', id: user.id },
    can: (action: CompanyAction) => can(membership.role as Role, action),
  };
});

export async function authorizeCompanyAction(companyId: string, action: CompanyAction): Promise<CompanyContext> {
  const user = await requireUser();
  const membership = isUuid(companyId) ? await findMembership(companyId, user.id) : null;
  if (!membership) throw new DomainError('COMPANY_NOT_FOUND');
  if (!can(membership.role, action)) throw new DomainError('FORBIDDEN');
  return {
    ...membership,
    user,
    actor: { type: 'user', id: user.id },
    can: (other: CompanyAction) => can(membership.role, other),
  };
}
