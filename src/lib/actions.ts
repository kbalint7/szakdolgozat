'use server';

import { signIn } from '@/app/auth';
import { AuthError } from 'next-auth';
import { signUpSchema } from './zod';
import { addCustomer } from '@/db/query/customer';
import bcrypt from 'bcrypt';

type Props = { error?: boolean; description: string };

export async function login(formData: FormData): Promise<Props> {
	await new Promise(resolve => setTimeout(resolve, 1000));

	formData.append('redirectTo', '/dashboard');

	try {
		await signIn('credentials', formData);
		return { description: 'Sikeresen bejelentkeztél.' };
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return { error: true, description: error.message };
				default:
					return { error: true, description: 'Ismeretlen hiba történt.' };
			}
		}
		throw error;
	}
}

export async function register(formData: FormData): Promise<Props> {
	await new Promise(resolve => setTimeout(resolve, 1000));

	const credentials = {
		firstName: formData.get('firstName'),
		lastName: formData.get('lastName'),
		email: formData.get('email'),
		password: formData.get('password'),
		age: Number(formData.get('age')),
	};

	const parse = await signUpSchema.safeParseAsync(credentials);
	if (!parse.success) {
		return { error: true, description: parse.error.errors[0].message };
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(parse.data.password, salt);
	parse.data.password = hashedPassword;

	console.log(parse.data);

	try {
		const id = await addCustomer(parse.data);
	} catch (error) {
		if (
			error instanceof Error &&
			typeof error === 'object' &&
			'constraint' in error &&
			(error as any).constraint === 'customers_email_unique'
		) {
			return { error: true, description: 'Ez az email cím már foglalt!' };
		}

		console.error(error);
		return { error: true, description: 'Ismeretlen hiba történt.' };
	}

	return { description: `Sikeres regisztráció!` };
}
