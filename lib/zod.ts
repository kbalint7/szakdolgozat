import { object, string, number, email } from 'zod';

export const signInSchema = object({
  email: email('Érvénytelen email'),
  password: string('Jelszó megadása kötelező')
    .min(1, 'Jelszó megadása kötelező')
    .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
    .max(32, 'A jelszó legfeljebb 32 karakter hosszú lehet'),
});

export const signUpSchema = object({
  firstName: string('Keresztnév megadása kötelező')
    .trim()
    .min(1, 'Keresztnév megadása kötelező')
    .max(255, 'A keresztnév legfeljebb 255 karakter hosszú lehet'),
  lastName: string('Vezetéknév megadása kötelező')
    .trim()
    .min(1, 'Vezetéknév megadása kötelező')
    .max(255, 'A vezetéknév legfeljebb 255 karakter hosszú lehet'),
  email: email('Érvénytelen email'),
  password: string('Jelszó megadása kötelező')
    .min(1, 'Jelszó megadása kötelező')
    .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
    .max(32, 'A jelszó legfeljebb 32 karakter hosszú lehet'),
  age: number('Kor megadása kötelező').min(0, 'A kor nem lehet negatív'),
});
