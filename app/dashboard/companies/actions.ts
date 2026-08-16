'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { requireUser } from '@/lib/auth/session';
import {
  createCompany,
  deleteCompany,
  leaveCompany,
  removeMember,
  setMemberRole,
  transferOwnership,
  updateCompany,
} from '@/lib/services/companies';
import { companySchema, deleteCompanySchema, memberRoleSchema } from '@/lib/validation/company';

export async function createCompanyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let companyId: string;
  try {
    companyId = (await createCompany(user.id, parsed.data)).id;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  redirect(`/dashboard/companies/${companyId}`);
}

export async function updateCompanyAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  try {
    const ctx = await authorizeCompanyAction(companyId, 'company.edit');
    await updateCompany(ctx.actor, companyId, parsed.data);
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('A cég adatai elmentve.');
}

export async function deleteCompanyAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  try {
    const ctx = await authorizeCompanyAction(companyId, 'company.delete');
    await deleteCompany(ctx.actor, companyId, parsed.data.confirmation);
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  redirect('/dashboard');
}

export async function leaveCompanyAction(companyId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'company.leave');
    await leaveCompany(ctx.user.id, companyId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect('/dashboard');
}

export async function removeMemberAction(companyId: string, membershipId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'members.remove');
    await removeMember(ctx.actor, ctx.role, companyId, membershipId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A tagot eltávolítottuk a cégből.');
}

export async function setMemberRoleAction(
  companyId: string,
  membershipId: string,
  role: 'admin' | 'member',
): Promise<ActionState> {
  const parsed = memberRoleSchema.safeParse({ role });
  if (!parsed.success) return validationError(parsed.error);
  try {
    const ctx = await authorizeCompanyAction(companyId, 'members.changeRole');
    await setMemberRole(ctx.actor, companyId, membershipId, parsed.data.role);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success(role === 'admin' ? 'A tag adminisztrátor lett.' : 'Az adminisztrátorból tag lett.');
}

export async function transferOwnershipAction(companyId: string, membershipId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'company.transferOwnership');
    await transferOwnership(ctx.user.id, companyId, membershipId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A tulajdonjog átadva. Mostantól adminisztrátor vagy.');
}
