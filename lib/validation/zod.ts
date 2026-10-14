import { z } from 'zod';

z.config(z.locales.hu());

export { z };

export const englishErrors = { error: z.locales.en().localeError };

export type FieldErrors = Record<string, string[] | undefined>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
