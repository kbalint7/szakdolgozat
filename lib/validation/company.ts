import { emailSchema } from './auth';
import { z } from './zod';

export const companySchema = z.object({
  name: z.string().trim().min(1, 'Add meg a cég nevét.').max(120, 'Legfeljebb 120 karakter.'),
  description: z.string().trim().max(1000, 'Legfeljebb 1000 karakter.').default(''),
});

export const deleteCompanySchema = z.object({
  confirmation: z.string().trim().min(1, 'Írd be a cég nevét a megerősítéshez.'),
});

export const memberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], { error: 'Válassz szerepkört.' }),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Add meg a neved.').max(201, 'Legfeljebb 201 karakter.'),
});

export const invitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member'], { error: 'Válassz szerepkört.' }),
});

export const linkMemberSchema = z.object({
  membershipId: z.uuid({ error: 'Válassz tagot.' }),
});

export type CompanyInput = z.infer<typeof companySchema>;
