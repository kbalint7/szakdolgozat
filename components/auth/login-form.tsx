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
import { signInSchema } from '@/lib/validation/auth';
import { toFieldErrors, type FieldErrors } from '@/lib/validation/zod';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setError(undefined);

    startTransition(async () => {
      const { error } = await authClient.signIn.email(parsed.data);
      if (error) {
        setError(
          error.status === 429
            ? 'Túl sok próbálkozás. Várj egy percet, majd próbáld újra.'
            : 'Hibás e-mail-cím vagy jelszó.',
        );
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
          autoComplete="current-password"
          errors={fieldErrors.password}
          required
        />
        <SubmitButton pending={pending} disabled={!hydrated} className="w-full">
          Bejelentkezés
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
