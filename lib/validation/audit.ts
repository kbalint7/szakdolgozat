import { AUDIT_CATEGORIES } from '@/lib/domain/audit';

import { z } from './zod';

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

export const auditFilterSchema = z.object({
  category: z.enum(AUDIT_CATEGORIES).optional().catch(undefined),
  hrId: z.string().trim().max(64).optional().catch(undefined),
  from: day,
  to: day,
  before: z.coerce.number().int().positive().optional().catch(undefined),
});
