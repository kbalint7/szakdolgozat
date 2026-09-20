import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { clientTokens } from '@/db/schema';
import { generatePrefixedSecret } from '@/lib/crypto';
import { DomainError } from '@/lib/errors';

import { audit } from './audit';

export const CLIENT_TOKEN_KIND = 'lm_ct';

export async function createClientToken(userId: string, name: string) {
  const secret = generatePrefixedSecret(CLIENT_TOKEN_KIND);
  return db.transaction(async tx => {
    const [token] = await tx
      .insert(clientTokens)
      .values({ userId, name, prefix: secret.prefix, tokenHash: secret.hash })
      .returning({ id: clientTokens.id });
    await audit(tx, {
      actor: { type: 'user', id: userId },
      action: 'client_token.created',
      targetType: 'client_token',
      targetId: token.id,
      data: { name, prefix: secret.prefix },
    });
    return { id: token.id, token: secret.token };
  });
}

export async function listClientTokens(userId: string) {
  return db
    .select({
      id: clientTokens.id,
      name: clientTokens.name,
      prefix: clientTokens.prefix,
      createdAt: clientTokens.createdAt,
      lastUsedAt: clientTokens.lastUsedAt,
      revokedAt: clientTokens.revokedAt,
    })
    .from(clientTokens)
    .where(eq(clientTokens.userId, userId))
    .orderBy(desc(clientTokens.createdAt));
}

export async function revokeClientToken(userId: string, tokenId: string) {
  await db.transaction(async tx => {
    const [token] = await tx
      .update(clientTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(clientTokens.id, tokenId), eq(clientTokens.userId, userId), isNull(clientTokens.revokedAt)))
      .returning({ id: clientTokens.id, prefix: clientTokens.prefix });
    if (!token) throw new DomainError('CLIENT_TOKEN_NOT_FOUND');
    await audit(tx, {
      actor: { type: 'user', id: userId },
      action: 'client_token.revoked',
      targetType: 'client_token',
      targetId: token.id,
      data: { prefix: token.prefix },
    });
  });
}
