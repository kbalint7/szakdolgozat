import { apiError, bearerToken, BodyError, json, readJsonBody, validationFailed } from '@/lib/api/http';
import { authenticateClientToken } from '@/lib/services/client-tokens';
import { checkLicense } from '@/lib/services/license-check';
import { englishErrors, z } from '@/lib/validation/zod';

const checkSchema = z.strictObject({
  product: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function POST(request: Request) {
  const token = bearerToken(request);
  const client = token ? await authenticateClientToken(token) : null;
  if (!client) return apiError(401, 'UNAUTHORIZED', 'Missing, unknown or revoked client token.');

  let body: unknown;
  try {
    body = await readJsonBody(request, 1024);
  } catch (error) {
    if (error instanceof BodyError) return error.response;
    throw error;
  }
  const parsed = checkSchema.safeParse(body, englishErrors);
  if (!parsed.success) return validationFailed(parsed.error);

  const result = await checkLicense({ userId: client.userId, clientTokenId: client.id }, parsed.data.product);
  if (!result.found) return apiError(404, 'PRODUCT_NOT_FOUND', `No product with slug "${parsed.data.product}".`);

  const { decision, product, validUntil, checkedAt } = result;
  if (decision.allowed) {
    return json({
      allowed: true,
      product: product.slug,
      company: { id: decision.companyId, name: decision.companyName },
      seat: { assignedAt: decision.assignedAt.toISOString() },
      license: { validUntil: validUntil?.toISOString() ?? null },
      checkedAt: checkedAt.toISOString(),
    });
  }
  return json({
    allowed: false,
    product: product.slug,
    reason: decision.reason,
    ...(decision.reason === 'WAITLISTED' ? { waitlistPosition: decision.waitlistPosition } : {}),
    checkedAt: checkedAt.toISOString(),
  });
}
