'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { createApiKey, revokeApiKey } from '@/lib/services/api-keys';
import { apiKeySchema } from '@/lib/validation/hr';

export async function createApiKeyAction(
  companyId: string,
  _prev: ActionState<{ token: string }>,
  formData: FormData,
): Promise<ActionState<{ token: string }>> {
  const parsed = apiKeySchema.safeParse({ name: formData.get('name'), scopes: formData.getAll('scopes') });
  if (!parsed.success) return validationError(parsed.error, formData);

  let token: string;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'apiKeys.manage');
    token = (await createApiKey({ type: 'user', id: ctx.user.id }, companyId, parsed.data)).token;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('Az API-kulcs elkészült.', { token });
}

export async function revokeApiKeyAction(companyId: string, keyId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'apiKeys.manage');
    await revokeApiKey(ctx.actor, companyId, keyId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('Az API-kulcsot visszavontuk. A következő kérést 401-gyel elutasítjuk.');
}
