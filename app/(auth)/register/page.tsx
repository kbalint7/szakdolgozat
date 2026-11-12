import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AuthCard, AuthCardSkeleton } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { SkeletonButton, SkeletonField } from '@/components/page-skeleton';
import { FieldGroup } from '@/components/ui/field';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Regisztráció' };

async function RedirectIfSignedIn() {
  if (await getSession()) {
    redirect('/dashboard');
  }
  return null;
}

function RegisterSkeleton() {
  return (
    <AuthCardSkeleton
      title="Regisztráció"
      description="A fiókoddal céget hozhatsz létre, vagy csatlakozhatsz ahhoz, amelyikbe meghívtak."
      footer="Már van fiókod? Jelentkezz be"
    >
      <FieldGroup>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SkeletonField label="Vezetéknév" />
          <SkeletonField label="Keresztnév" />
        </div>
        <SkeletonField label="E-mail-cím" />
        <SkeletonField label="Jelszó" description={['○ 8–128 karakter', '○ kisbetű', '○ nagybetű', '○ számjegy']} />
        <SkeletonButton className="w-full">Regisztráció</SkeletonButton>
      </FieldGroup>
    </AuthCardSkeleton>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RedirectIfSignedIn />
      <AuthCard
        title="Regisztráció"
        description="A fiókoddal céget hozhatsz létre, vagy csatlakozhatsz ahhoz, amelyikbe meghívtak."
        footer={
          <>
            Már van fiókod?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Jelentkezz be
            </Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </Suspense>
  );
}
