'use server';

import { APIError } from 'better-auth';

import { auth } from '@/lib/auth';
import { SignInData, signInSchema, SignUpData, signUpSchema } from '@/lib/zod';

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(data: SignInData): Promise<ActionResult> {
  const parse = await signInSchema.safeParseAsync(data);
  if (!parse.success) {
    return { success: false };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parse.data.email,
        password: parse.data.password,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 'UNAUTHORIZED') {
        return { success: false, error: 'Hibás email vagy jelszó!' };
      }
    }

    return { success: false };
  }
}

export async function registerAction(data: SignUpData): Promise<ActionResult> {
  const parse = await signUpSchema.safeParseAsync(data);
  if (!parse.success) {
    return { success: false };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: parse.data.email,
        password: parse.data.password,
        name: `${parse.data.firstName} ${parse.data.lastName}`,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 'UNPROCESSABLE_ENTITY') {
        return { success: false, error: 'Ez az email cím már foglalt!' };
      }
    }

    return { success: false };
  }
}