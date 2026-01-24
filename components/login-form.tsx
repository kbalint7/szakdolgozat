'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/submit-button';
import { authClient } from '@/lib/auth-client';
import { loginAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { signInSchema, type SignInData } from '@/lib/zod';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';

export function LoginForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const form = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  async function onSubmit(data: SignInData) {
    const result = await loginAction(data);

    if (!result.success) {
      toast.error(result.error ?? 'Hiba történt a bejelentkezés során.');
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <Card className="w-full sm:max-w-sm">
      <CardHeader>
        <CardTitle>Bejelentkezés</CardTitle>
        <CardDescription>Kérlek jelentkezz be</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input {...field} id="email" aria-invalid={fieldState.invalid} placeholder="john@example.com" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Jelszó</FieldLabel>
                  <Input {...field} id="password" type="password" aria-invalid={fieldState.invalid} placeholder="doe123" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field>
          <SubmitButton form="login-form" text="Bejelentkezés" loading={form.formState.isSubmitting} />
          <Button asChild variant="outline">
            <Link href="/register">Regisztráció</Link>
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
