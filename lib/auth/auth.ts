import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { betterAuth } from 'better-auth/minimal';
import { nextCookies } from 'better-auth/next-js';

import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, signUpRequestSchema } from '@/lib/validation/auth';

export const auth = betterAuth({
  appName: 'Licenckezelő',
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      isPlatformAdmin: { type: 'boolean', required: true, defaultValue: false, input: false },
    },
  },
  session: {
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async ctx => {
      if (ctx.path !== '/sign-up/email') return;
      const parsed = signUpRequestSchema.safeParse(ctx.body);
      if (!parsed.success) {
        throw new APIError('BAD_REQUEST', {
          code: 'VALIDATION_FAILED',
          message: parsed.error.issues[0]?.message ?? 'Érvénytelen adatok.',
        });
      }
    }),
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
