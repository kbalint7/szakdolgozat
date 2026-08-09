import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AuthCard, AuthCardSkeleton, AuthLayout } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Regisztráció' };

async function RedirectIfSignedIn() {
  if (await getSession()) {
    redirect('/dashboard');
  }
  return null;
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthCardSkeleton />}>
        <RedirectIfSignedIn />
        <AuthCard
          title="Regisztráció"
          description="Hozz létre egy fiókot a licenckezelőhöz."
          footer={
            <span>
              Már van fiókod?{' '}
              <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                Jelentkezz be
              </Link>
            </span>
          }
        >
          <RegisterForm />
        </AuthCard>
      </Suspense>
    </AuthLayout>
  );
}
