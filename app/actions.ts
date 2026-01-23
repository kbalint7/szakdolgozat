'use server';

import { auth } from '@/lib/auth';
import { signInSchema, signUpSchema } from '@/lib/zod';
import { APIError } from 'better-auth';

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const credentials = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parse = await signInSchema.safeParseAsync(credentials);
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

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const credentials = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    age: Number(formData.get('age')),
  };

  const parse = await signUpSchema.safeParseAsync(credentials);
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
