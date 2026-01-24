'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/submit-button';
import { authClient } from '@/lib/auth-client';
import { registerAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { signUpSchema, type SignUpData } from '@/lib/zod';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';

export function RegisterForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  async function onSubmit(data: SignUpData) {
    const result = await registerAction(data);

    if (!result.success) {
      toast.error(result.error ?? 'Hiba történt a regisztráció során.');
      return;
    }

    toast.success('Sikeres regisztráció!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="w-full sm:max-w-sm">
      <CardHeader>
        <CardTitle>Regisztráció</CardTitle>
        <CardDescription>Kérlek regisztrálj</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="register-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="firstName">Keresztnév</FieldLabel>
                  <Input {...field} id="firstName" aria-invalid={fieldState.invalid} placeholder="John" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lastName">Vezetéknév</FieldLabel>
                  <Input {...field} id="lastName" aria-invalid={fieldState.invalid} placeholder="Doe" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
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
            <Controller
              name="age"
              control={form.control}
              render={({ field: { onChange, value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="age">Életkor</FieldLabel>
                  <Input
                    {...field}
                    value={value ?? ''}
                    onChange={e => {
                      const val = e.target.valueAsNumber;
                      onChange(Number.isNaN(val) ? undefined : val);
                    }}
                    id="age"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="20"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field>
          <SubmitButton form="register-form" text="Regisztráció" loading={form.formState.isSubmitting} />
          <Button asChild variant="outline">
            <Link href="/login">Vissza a bejelentkezésre</Link>
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
