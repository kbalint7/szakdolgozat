import { after } from 'next/server';

import { requireApiKey } from '@/lib/api/auth';
import { apiError, BodyError, json, readJsonBody, validationFailed } from '@/lib/api/http';
import { parseHrEvent } from '@/lib/domain/hr-events';
import { isDomainError } from '@/lib/errors';
import { ingestEvent, processEvent } from '@/lib/services/hr-events';

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const auth = await requireApiKey(request, 'hr:events:write');
  if ('response' in auth) return auth.response;

  let body: unknown;
  try {
    body = await readJsonBody(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyError) return error.response;
    throw error;
  }

  const parsed = parseHrEvent(body);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    const result = await ingestEvent(
      { companyId: auth.key.companyId, source: 'api', apiKeyId: auth.key.id },
      parsed.data,
    );
    if (result.status === 'duplicate') {
      return json({ status: 'duplicate', eventId: result.eventId }, 200);
    }
    after(() => processEvent(result.id));
    return json({ status: 'accepted', eventId: result.eventId }, 202);
  } catch (error) {
    if (isDomainError(error) && error.code === 'EVENT_ID_CONFLICT') {
      return apiError(409, 'EVENT_ID_CONFLICT', 'An event with this eventId but a different payload already exists.');
    }
    throw error;
  }
}
