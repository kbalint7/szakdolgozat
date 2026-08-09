import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AuthCard, AuthCardSkeleton, AuthLayout } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Bejelentkezés' };

async function RedirectIfSignedIn() {
  if (await getSession()) {
    redirect('/dashboard');
  }
  return null;
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthCardSkeleton />}>
        <RedirectIfSignedIn />
        <AuthCard
          title="Bejelentkezés"
          description="Lépj be a fiókodba a licencek kezeléséhez."
          footer={
            <span>
              Még nincs fiókod?{' '}
              <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
                Regisztrálj
              </Link>
            </span>
          }
        >
          <LoginForm />
        </AuthCard>
      </Suspense>
    </AuthLayout>
  );
}
