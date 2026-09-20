'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { requireUser } from '@/lib/auth/session';
import { createClientToken, revokeClientToken } from '@/lib/services/client-tokens';
import { z } from '@/lib/validation/zod';

const tokenSchema = z.object({
  name: z.string().trim().min(1, 'Adj nevet a tokennek.').max(100, 'Legfeljebb 100 karakter.'),
});

export async function createTokenAction(
  _prev: ActionState<{ token: string }>,
  formData: FormData,
): Promise<ActionState<{ token: string }>> {
  const user = await requireUser();
  const parsed = tokenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  let token: string;
  try {
    token = (await createClientToken(user.id, parsed.data.name)).token;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('A token elkészült.', { token });
}

export async function revokeTokenAction(tokenId: string): Promise<ActionState> {
  const user = await requireUser();
  try {
    await revokeClientToken(user.id, tokenId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A tokent visszavontuk.');
}
