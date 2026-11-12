'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import { failure, type ActionState } from '@/lib/action-state';
import { requireUser } from '@/lib/auth/session';
import { acceptInvitation, declineInvitation } from '@/lib/services/invitations';

export async function acceptInvitationAction(token: string): Promise<ActionState> {
  const user = await requireUser();
  let companyId: string;
  try {
    companyId = (await acceptInvitation(user, token)).companyId;
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect(`/dashboard/companies/${companyId}`);
}

export async function declineInvitationAction(token: string): Promise<ActionState> {
  const user = await requireUser();
  try {
    await declineInvitation(user, token);
  } catch (error) {
    return failure(error);
  }
  redirect('/dashboard');
}
