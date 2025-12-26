'use client';

import Form from 'next/form';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/submit-button';
import { authClient } from '@/lib/auth-client';
import { signUpSchema } from '@/lib/zod';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    const credentials = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
      age: Number(formData.get('age')),
    };

    const parse = await signUpSchema.safeParseAsync(credentials);
    if (!parse.success) {
      toast.error(parse.error.issues[0].message);
      return;
    }

    const email = parse.data.email;
    const password = parse.data.password;
    const name = parse.data.firstName + ' ' + parse.data.lastName;

    const { data, error } = await authClient.signUp.email({ email, password, name });
    if (error) {
      if (error.message) toast.error(error.message);
      else toast.error(error.statusText);
      return;
    }

    toast.success('Sikeres regisztráció!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Form action={onSubmit} className="w-96 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Regisztráció</CardTitle>
          <CardDescription>Kérlek regisztrálj</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div>
            <Label htmlFor="firstName" className="text-lg">
              Keresztnév
            </Label>
            <Input id="firstName" name="firstName" type="firstName" placeholder="John" />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-lg">
              Vezetéknév
            </Label>
            <Input id="lastName" name="lastName" type="lastName" placeholder="Doe" />
          </div>

          <div>
            <Label htmlFor="email" className="text-lg">
              Email
            </Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" />
          </div>

          <div>
            <Label htmlFor="password" className="text-lg">
              Jelszó
            </Label>
            <Input id="password" name="password" type="password" placeholder="doe123" />
          </div>

          <div>
            <Label htmlFor="age" className="text-lg">
              Életkor
            </Label>
            <Input id="age" name="age" type="age" placeholder="20" />
          </div>
        </CardContent>
        <CardFooter className="grid">
          <SubmitButton text="Regisztráció" />
          <Button asChild className="mt-3" variant="outline">
            <Link href="/login">Vissza a bejelentkezésre</Link>
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
