'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { appUrl } from '@/lib/app-url';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { createInvitation, regenerateInvitationLink, revokeInvitation } from '@/lib/services/invitations';
import { invitationSchema } from '@/lib/validation/company';

export type InvitationLink = { link: string; email?: string };

export async function inviteAction(
  companyId: string,
  _prev: ActionState<InvitationLink>,
  formData: FormData,
): Promise<ActionState<InvitationLink>> {
  const parsed = invitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let data: InvitationLink;
  try {
    const ctx = await authorizeCompanyAction(
      companyId,
      parsed.data.role === 'admin' ? 'members.changeRole' : 'members.invite',
    );
    const { token, invitation } = await createInvitation({ type: 'user', id: ctx.user.id }, companyId, parsed.data);
    data = { link: appUrl(`/invitations/${token}`), email: invitation.email };
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('A meghívó elkészült. Küldd el a linket a meghívottnak.', data);
}

export async function regenerateLinkAction(
  companyId: string,
  invitationId: string,
): Promise<ActionState<InvitationLink>> {
  let data: InvitationLink;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'members.invite');
    const { token } = await regenerateInvitationLink(ctx.actor, companyId, invitationId);
    data = { link: appUrl(`/invitations/${token}`) };
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('Új meghívólink készült; a korábbi link érvénytelen.', data);
}

export async function revokeInvitationAction(companyId: string, invitationId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'members.invite');
    await revokeInvitation(ctx.actor, companyId, invitationId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A meghívót visszavontuk.');
}
