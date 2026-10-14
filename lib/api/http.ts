import type { z } from '@/lib/validation/zod';

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'EVENT_ID_CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR';

const noStore = { 'Cache-Control': 'no-store' };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...noStore, ...headers } });
}

export function apiError(status: number, code: ApiErrorCode, message: string, details?: unknown): Response {
  const headers: Record<string, string> = status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {};
  return json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status, headers);
}

export function validationFailed(error: z.ZodError): Response {
  return apiError(
    400,
    'VALIDATION_FAILED',
    'The request body is invalid.',
    error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
  );
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  const match = header ? /^Bearer\s+(\S+)$/i.exec(header) : null;
  return match ? match[1] : null;
}

export class BodyError extends Error {
  constructor(public readonly response: Response) {
    super('invalid body');
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > maxBytes) {
    throw new BodyError(apiError(400, 'VALIDATION_FAILED', `The body must not exceed ${maxBytes} bytes.`));
  }
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new BodyError(apiError(400, 'VALIDATION_FAILED', `The body must not exceed ${maxBytes} bytes.`));
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
  } catch {
    throw new BodyError(apiError(400, 'VALIDATION_FAILED', 'The body must be valid UTF-8 JSON.'));
  }
}
