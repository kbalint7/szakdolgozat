'use server';

import { refresh } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { auth } from '@/lib/auth/auth';
import { requireUser } from '@/lib/auth/session';
import { deleteAccount, updateProfileName } from '@/lib/services/companies';
import { profileSchema } from '@/lib/validation/company';

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  try {
    await updateProfileName(user.id, parsed.data.name);
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('A profil elmentve.');
}

export async function deleteAccountAction(): Promise<ActionState> {
  const user = await requireUser();
  try {
    await deleteAccount(user.id);
  } catch (error) {
    return failure(error);
  }
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
  redirect('/');
}
