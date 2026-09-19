import { jobRoleSchema } from './rules';
import { z } from './zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform(value => value || undefined);

export const manualEventSchema = z
  .object({
    type: z.enum(['employee.hired', 'employee.role_changed', 'employee.terminated'], {
      error: 'Válassz eseménytípust.',
    }),
    hrId: z.string().trim().min(1, 'Add meg a HR-azonosítót.').max(64, 'Legfeljebb 64 karakter.'),
    name: optionalText.pipe(z.string().max(200, 'Legfeljebb 200 karakter.').optional()),
    email: optionalText.pipe(z.email('Érvénytelen e-mail-cím.').optional()),
    jobRole: optionalText.pipe(jobRoleSchema.optional()),
    occurredAt: z.iso.datetime({ offset: true, error: 'Érvénytelen időpont.' }),
  })
  .superRefine((value, ctx) => {
    if (value.type !== 'employee.terminated' && !value.jobRole) {
      ctx.addIssue({ code: 'custom', path: ['jobRole'], message: 'Belépésnél és munkakörváltásnál kötelező.' });
    }
  });

export const apiKeySchema = z.object({
  name: z.string().trim().min(1, 'Adj nevet a kulcsnak.').max(100, 'Legfeljebb 100 karakter.'),
  scopes: z.array(z.enum(['hr:events:write', 'hr:events:read'])).min(1, 'Legalább egy jogosultságot válassz.'),
});

export const employeeFilterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(['active', 'terminated']).optional().catch(undefined),
});
