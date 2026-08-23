import { checkbox } from './catalog';
import { z } from './zod';

export const purchaseSchema = z.object({
  companyId: z.uuid({ error: 'Válassz céget.' }),
  activate: checkbox,
});

export const activateKeySchema = z.object({
  key: z
    .string({ error: 'Add meg a licenckulcsot.' })
    .trim()
    .min(1, 'Add meg a licenckulcsot.')
    .max(64, 'Érvénytelen licenckulcs.'),
});

export const issueKeySchema = z.object({
  planId: z.uuid({ error: 'Válassz csomagot.' }),
});
