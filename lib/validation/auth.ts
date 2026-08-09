import { z } from './zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string({ error: 'Add meg a jelszót.' })
  .min(PASSWORD_MIN_LENGTH, `A jelszónak legalább ${PASSWORD_MIN_LENGTH} karakterből kell állnia.`)
  .max(PASSWORD_MAX_LENGTH, `A jelszó legfeljebb ${PASSWORD_MAX_LENGTH} karakter lehet.`)
  .regex(/\p{Ll}/u, 'A jelszónak tartalmaznia kell legalább egy kisbetűt.')
  .regex(/\p{Lu}/u, 'A jelszónak tartalmaznia kell legalább egy nagybetűt.')
  .regex(/\p{Nd}/u, 'A jelszónak tartalmaznia kell legalább egy számjegyet.');

export const emailSchema = z
  .string({ error: 'Add meg az e-mail-címet.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Érvénytelen e-mail-cím.' }).max(254, 'Az e-mail-cím túl hosszú.'));

const nameSchema = (label: string) =>
  z
    .string({ error: `Add meg a ${label}.` })
    .trim()
    .min(1, `Add meg a ${label}.`)
    .max(100, `A ${label} legfeljebb 100 karakter lehet.`);

export const signUpSchema = z.object({
  lastName: nameSchema('vezetéknevet'),
  firstName: nameSchema('keresztnevet'),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Add meg a jelszót.').max(PASSWORD_MAX_LENGTH),
});

export const signUpRequestSchema = z.object({
  name: z.string().trim().min(1).max(201),
  email: emailSchema,
  password: passwordSchema,
});

export function fullName(data: { lastName: string; firstName: string }) {
  return `${data.lastName.trim()} ${data.firstName.trim()}`;
}

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
