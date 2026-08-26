import { z } from './zod';

export const jobRoleSchema = z
  .string({ error: 'Add meg a munkakört.' })
  .trim()
  .min(1, 'Add meg a munkakört.')
  .max(64, 'Legfeljebb 64 karakter.')
  .regex(/^[a-z0-9_-]+$/, 'Csak kisbetű, számjegy, kötőjel és aláhúzás használható (pl. developer).');

export const ruleSchema = z.object({
  jobRole: jobRoleSchema,
  productId: z.uuid({ error: 'Válassz terméket.' }),
});

export type RuleInput = z.infer<typeof ruleSchema>;
