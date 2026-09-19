import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { apiKeys, users } from '@/db/schema';
import { generatePrefixedSecret } from '@/lib/crypto';
import { DomainError } from '@/lib/errors';

import { audit, type Actor } from './audit';

export const API_KEY_KIND = 'lm_live';
export const API_KEY_SCOPES = ['hr:events:write', 'hr:events:read'] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export async function createApiKey(
  actor: Actor & { type: 'user' },
  companyId: string,
  input: { name: string; scopes: ApiKeyScope[] },
) {
  const secret = generatePrefixedSecret(API_KEY_KIND);
  return db.transaction(async tx => {
    const [key] = await tx
      .insert(apiKeys)
      .values({
        companyId,
        name: input.name,
        prefix: secret.prefix,
        keyHash: secret.hash,
        scopes: input.scopes,
        createdBy: actor.id,
      })
      .returning({ id: apiKeys.id, prefix: apiKeys.prefix });
    await audit(tx, {
      companyId,
      actor,
      action: 'api_key.created',
      targetType: 'api_key',
      targetId: key.id,
      data: { name: input.name, prefix: key.prefix, scopes: input.scopes },
    });
    return { id: key.id, token: secret.token };
  });
}

export async function listApiKeys(companyId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdBy: users.name,
    })
    .from(apiKeys)
    .leftJoin(users, eq(users.id, apiKeys.createdBy))
    .where(eq(apiKeys.companyId, companyId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(actor: Actor, companyId: string, keyId: string) {
  await db.transaction(async tx => {
    const [key] = await tx
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.companyId, companyId), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id, prefix: apiKeys.prefix });
    if (!key) throw new DomainError('API_KEY_NOT_FOUND');
    await audit(tx, {
      companyId,
      actor,
      action: 'api_key.revoked',
      targetType: 'api_key',
      targetId: key.id,
      data: { prefix: key.prefix },
    });
  });
}
