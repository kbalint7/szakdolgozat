import { unstable_rethrow } from 'next/navigation';

import { isDomainError } from '@/lib/errors';
import { errorMessage } from '@/lib/i18n/errors';
import { toFieldErrors, type FieldErrors, type z } from '@/lib/validation/zod';

export type ActionState<TData = unknown> = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  data?: TData;
};

export const initialActionState: ActionState = { status: 'idle' };

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) values[key] = value;
  }
  return values;
}

export function validationError(error: z.ZodError, formData?: FormData): ActionState<never> {
  return {
    status: 'error',
    message: 'Ellenőrizd a kiemelt mezőket.',
    fieldErrors: toFieldErrors(error),
    values: formData ? formValues(formData) : undefined,
  };
}

export function failure(error: unknown, formData?: FormData): ActionState<never> {
  unstable_rethrow(error);
  if (!isDomainError(error)) {
    console.error(error);
  }
  return {
    status: 'error',
    message: isDomainError(error) ? errorMessage(error.code) : 'Váratlan hiba történt. Próbáld újra.',
    values: formData ? formValues(formData) : undefined,
  };
}

export function success<TData>(message: string, data?: TData): ActionState<TData> {
  return { status: 'success', message, data };
}
