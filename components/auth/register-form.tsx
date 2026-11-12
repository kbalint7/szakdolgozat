'use client';

import { cn } from 'cn';
import { CheckIcon, XIcon } from 'lucide-react';
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

const passwordRules = [
  {
    label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} karakter`,
    message: `A jelszónak legalább ${PASSWORD_MIN_LENGTH} karakterből kell állnia.`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  },
  {
    label: 'kisbetű',
    message: 'A jelszónak tartalmaznia kell legalább egy kisbetűt.',
    test: (value: string) => /\p{Ll}/u.test(value),
  },
  {
    label: 'nagybetű',
    message: 'A jelszónak tartalmaznia kell legalább egy nagybetűt.',
    test: (value: string) => /\p{Lu}/u.test(value),
  },
  {
    label: 'számjegy',
    message: 'A jelszónak tartalmaznia kell legalább egy számjegyet.',
    test: (value: string) => /\p{Nd}/u.test(value),
  },
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [password, setPassword] = useState('');
  const [passwordChecked, setPasswordChecked] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setPasswordChecked(true);
    if (!parsed.success) {
      const { password: _password, ...others } = toFieldErrors(parsed.error);
      setFieldErrors(others);
      return;
    }
    setFieldErrors({});
    setError(undefined);

    startTransition(async () => {
      const result = await authClient.signUp
        .email({
          name: fullName(parsed.data),
          email: parsed.data.email,
          password: parsed.data.password,
        })
        .catch(() => null);
      if (!result) {
        setError('Nem sikerült elérni a szervert. Ellenőrizd a kapcsolatot, majd próbáld újra.');
        return;
      }
      const { error } = result;
      if (error) {
        if (error.status === 422 || error.code === 'USER_ALREADY_EXISTS') {
          setFieldErrors({ email: ['Ezzel az e-mail-címmel már regisztráltak.'] });
        } else if (error.status === 429) {
          setError('Túl sok próbálkozás. Várj egy percet, majd próbáld újra.');
        } else {
          setError(error.message ?? 'Nem sikerült a regisztráció. Próbáld újra.');
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
            errors={fieldErrors.lastName}
            required
          />
          <TextField
            name="firstName"
            label="Keresztnév"
            autoComplete="given-name"
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
          value={password}
          onChange={event => setPassword(event.target.value)}
          description={
            <span className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {passwordRules.map(rule => {
                const met = rule.test(password);
                const state = passwordChecked ? (met ? 'met' : 'unmet') : undefined;
                return (
                  <span
                    key={rule.label}
                    data-state={state}
                    title={state === 'unmet' ? rule.message : undefined}
                    className={cn('flex items-center gap-1.5', state === 'unmet' && 'font-medium text-destructive')}
                  >
                    {state === 'met' && <CheckIcon aria-hidden className="size-3.5 shrink-0" />}
                    {state === 'unmet' && <XIcon aria-hidden className="size-3.5 shrink-0" />}
                    {!state && (
                      <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
                        <span className="size-1.5 rounded-full border border-current opacity-60" />
                      </span>
                    )}
                    <span>
                      {rule.label}
                      {state && <span className="sr-only">: {met ? 'teljesül' : rule.message}</span>}
                    </span>
                  </span>
                );
              })}
            </span>
          }
          invalid={passwordChecked && passwordRules.some(rule => !rule.test(password))}
          required
        />
        <SubmitButton pending={pending} disabled={!hydrated} className="w-full">
          Regisztráció
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
