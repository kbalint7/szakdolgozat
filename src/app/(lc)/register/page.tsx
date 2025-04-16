'use client';

import Form from 'next/form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { register } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function SubmitButton() {
	const { pending } = useFormStatus();

	if (pending) {
		return (
			<Button disabled>
				<Loader2 className="animate-spin" />
				Regisztráció
			</Button>
		);
	}

	return (
		<Button className="w-full text-md" type="submit">
			Regisztráció
		</Button>
	);
}

export default function RegisterPage() {
	async function onSubmit(formData: FormData) {
		const res = await register(formData);
		if (res.error) {
			toast.error(res.description);
		} else {
			toast.success(res.description);
		}
	}

	return (
		<main className="flex flex-col items-center p-4">
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
						<SubmitButton />
					</CardFooter>
				</Card>
			</Form>
		</main>
	);
}
