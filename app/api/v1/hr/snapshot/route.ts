import { after } from 'next/server';

import { requireApiKey } from '@/lib/api/auth';
import { apiError, BodyError, json, readJsonBody, validationFailed } from '@/lib/api/http';
import { hrSnapshotSchema } from '@/lib/domain/hr-snapshot';
import { isDomainError } from '@/lib/errors';
import { processEvent } from '@/lib/services/hr-events';
import { ingestSnapshot } from '@/lib/services/hr-snapshot';
import { englishErrors } from '@/lib/validation/zod';

const MAX_BODY_BYTES = 1024 * 1024;

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
  const parsed = hrSnapshotSchema.safeParse(body, englishErrors);
  if (!parsed.success) return validationFailed(parsed.error);

  let result: Awaited<ReturnType<typeof ingestSnapshot>>;
  try {
    result = await ingestSnapshot({ companyId: auth.key.companyId, apiKeyId: auth.key.id }, parsed.data);
  } catch (error) {
    if (isDomainError(error) && error.code === 'EVENT_ID_CONFLICT') {
      return apiError(409, 'EVENT_ID_CONFLICT', 'This snapshotId was already used with different content.');
    }
    throw error;
  }
  const { diff, accepted } = result;
  after(async () => {
    for (const event of accepted) await processEvent(event.id);
  });

  return json(
    {
      status: 'accepted',
      snapshotId: parsed.data.snapshotId,
      events: {
        hired: diff.hired,
        roleChanged: diff.roleChanged,
        terminated: diff.terminated,
        unchanged: diff.unchanged,
        newlyAccepted: accepted.length,
      },
    },
    202,
  );
}
