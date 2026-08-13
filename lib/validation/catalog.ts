import { z } from './zod';

export const checkbox = z.preprocess(value => value === 'on' || value === 'true' || value === true, z.boolean());

const optionalPositiveInt = (message: string) =>
  z.preprocess(
    value => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number({ error: message }).int(message).positive(message).max(36_500, message).nullable(),
  );

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Add meg a termék nevét.').max(120, 'Legfeljebb 120 karakter.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Legalább 2 karakter.')
    .max(64, 'Legfeljebb 64 karakter.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Csak kisbetű, számjegy és kötőjel használható (pl. ide-pro).'),
  summary: z.string().trim().max(200, 'Legfeljebb 200 karakter.').default(''),
  description: z.string().trim().max(5000, 'Legfeljebb 5000 karakter.').default(''),
});

export const planSchema = z.object({
  name: z.string().trim().min(1, 'Add meg a csomag nevét.').max(120, 'Legfeljebb 120 karakter.'),
  seatCount: z.coerce
    .number({ error: 'Adj meg egy pozitív egész számot.' })
    .int('Adj meg egy pozitív egész számot.')
    .positive('A helyek száma legalább 1.')
    .max(100_000, 'Legfeljebb 100 000 hely.'),
  durationDays: optionalPositiveInt('Az időtartam pozitív egész szám (nap), vagy hagyd üresen.'),
  priceHuf: z.coerce
    .number({ error: 'Adj meg egy nem negatív egész összeget.' })
    .int('Adj meg egy nem negatív egész összeget.')
    .min(0, 'Az ár nem lehet negatív.')
    .max(1_000_000_000, 'Túl magas ár.'),
  isActive: checkbox,
});

export type ProductInput = z.infer<typeof productSchema>;
export type PlanInput = z.infer<typeof planSchema>;
