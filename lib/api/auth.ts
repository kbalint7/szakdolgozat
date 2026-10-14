import { authenticateApiKey, type ApiKeyScope, type AuthenticatedApiKey } from '@/lib/services/api-keys';

import { apiError, bearerToken } from './http';

export async function requireApiKey(
  request: Request,
  scope: ApiKeyScope,
): Promise<{ key: AuthenticatedApiKey } | { response: Response }> {
  const token = bearerToken(request);
  if (!token) return { response: apiError(401, 'UNAUTHORIZED', 'Missing bearer token.') };
  const key = await authenticateApiKey(token);
  if (!key) return { response: apiError(401, 'UNAUTHORIZED', 'Unknown or revoked API key.') };
  if (!key.scopes.includes(scope)) {
    return { response: apiError(403, 'FORBIDDEN', `The API key lacks the ${scope} scope.`) };
  }
  return { key };
}
