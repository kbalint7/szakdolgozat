export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    this.name = 'DomainError';
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const pgError = findPgError(error);
  return pgError?.code === '23505' && (!constraint || pgError.constraint === constraint);
}

function findPgError(error: unknown): { code?: string; constraint?: string } | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current; depth++) {
    if (typeof current === 'object' && current !== null && 'code' in current) {
      return current as { code?: string; constraint?: string };
    }
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}
