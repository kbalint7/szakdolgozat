import { getCustomerByEmail } from '@/db/query/customer';
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { signInSchema } from '@/lib/zod';
import { comparePassword } from '@/lib/password';

class LogInError extends CredentialsSignin {
	constructor(code: string) {
		super();
		this.code = code;
		this.message = code;
		this.stack = undefined;
	}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			credentials: {
				email: {},
				password: {},
			},
			authorize: async credentials => {
				const parse = await signInSchema.safeParseAsync(credentials);
				if (!parse.success) throw new LogInError(parse.error.errors[0].message);

				const { email, password } = parse.data;
				const customer = await getCustomerByEmail(email);
				if (!customer) throw new LogInError('Nem létezik felhasználó ilyen email-el.');

				const passwordsMatch = comparePassword(password, customer.password);
				if (!passwordsMatch) throw new LogInError('A megadott jelszó hibás.');

				return customer;
			},
		}),
	],
});
