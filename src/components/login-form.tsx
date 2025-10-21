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
import { signInSchema } from '@/lib/zod';

export function LoginForm() {
    async function onSubmit(formData: FormData) {
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        const parse = await signInSchema.safeParseAsync(credentials);
        if (!parse.success) {
            toast.error(parse.error.errors[0].message);
            return;
        }

        const email = parse.data.email;
        const password = parse.data.password;

        const { data, error } = await authClient.signIn.email({ email, password, callbackURL: '/dashboard' });
        if (error) {
            if (error.message) toast.error(error.message);
            else toast.error(error.statusText);
        }
    }

    return (
        <Form action={onSubmit} className="w-96 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Bejelentkezés</CardTitle>
                    <CardDescription>Kérlek jelentkezz be</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
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
                </CardContent>
                <CardFooter className="grid">
                    <SubmitButton text="Bejelentkezés" />
                    <Button asChild className="mt-3" variant="outline">
                        <Link href="/register">Regisztráció</Link>
                    </Button>
                </CardFooter>
            </Card>
        </Form>
    );
}
