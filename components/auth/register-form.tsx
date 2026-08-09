'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { FieldGroup } from '@/components/ui/field';
import { useHydrated } from '@/hooks/use-hydrated';
import { authClient } from '@/lib/auth/client';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { fullName, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, signUpSchema } from '@/lib/validation/auth';
import { toFieldErrors, type FieldErrors } from '@/lib/validation/zod';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setError(undefined);

    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        name: fullName(parsed.data),
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        if (error.status === 422 || error.code === 'USER_ALREADY_EXISTS') {
          setFieldErrors({ email: ['Ezzel az e-mail-címmel már regisztráltak.'] });
        } else if (error.status === 429) {
          setError('Túl sok próbálkozás. Várj egy percet, majd próbáld újra.');
        } else {
          setError(error.message ?? 'Hiba történt a regisztráció során.');
        }
        return;
      }
      router.replace(safeRedirectPath(searchParams.get('next')));
      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormMessage status="error" message={error} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="lastName"
            label="Vezetéknév"
            autoComplete="family-name"
            placeholder="Kiss"
            errors={fieldErrors.lastName}
            required
          />
          <TextField
            name="firstName"
            label="Keresztnév"
            autoComplete="given-name"
            placeholder="Anna"
            errors={fieldErrors.firstName}
            required
          />
        </div>
        <TextField
          name="email"
          label="E-mail-cím"
          type="email"
          autoComplete="email"
          placeholder="nev@ceg.hu"
          errors={fieldErrors.email}
          required
        />
        <TextField
          name="password"
          label="Jelszó"
          type="password"
          autoComplete="new-password"
          description={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} karakter, legalább egy kisbetű, egy nagybetű és egy számjegy.`}
          errors={fieldErrors.password}
          required
        />
        <SubmitButton pending={pending} disabled={!hydrated} className="w-full">
          Regisztráció
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
