import { requireApiKey } from '@/lib/api/auth';
import { apiError, json } from '@/lib/api/http';
import { getHrEventStatus } from '@/lib/services/hr-events';

export async function GET(request: Request, ctx: RouteContext<'/api/v1/hr/events/[eventId]'>) {
  const auth = await requireApiKey(request, 'hr:events:read');
  if ('response' in auth) return auth.response;

  const { eventId } = await ctx.params;
  const event = await getHrEventStatus(auth.key.companyId, safeDecode(eventId));
  if (!event) return apiError(404, 'NOT_FOUND', 'No event with this eventId.');

  return json({
    eventId: event.eventId,
    status: event.status,
    attempts: event.attempts,
    ...(event.lastError ? { lastError: event.lastError } : {}),
    receivedAt: event.receivedAt.toISOString(),
    ...(event.processedAt ? { processedAt: event.processedAt.toISOString() } : {}),
    ...(event.status === 'failed' && event.nextAttemptAt ? { nextAttemptAt: event.nextAttemptAt.toISOString() } : {}),
  });
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
