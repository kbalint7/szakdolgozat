import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AuthCard, AuthCardSkeleton } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { SkeletonButton, SkeletonField } from '@/components/page-skeleton';
import { FieldGroup } from '@/components/ui/field';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Bejelentkezés' };

async function RedirectIfSignedIn() {
  if (await getSession()) {
    redirect('/dashboard');
  }
  return null;
}

function LoginSkeleton() {
  return (
    <AuthCardSkeleton title="Bejelentkezés" footer="Még nincs fiókod? Regisztrálj">
      <FieldGroup>
        <SkeletonField label="E-mail-cím" />
        <SkeletonField label="Jelszó" />
        <SkeletonButton className="w-full">Bejelentkezés</SkeletonButton>
      </FieldGroup>
    </AuthCardSkeleton>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <RedirectIfSignedIn />
      <AuthCard
        title="Bejelentkezés"
        footer={
          <>
            Még nincs fiókod?{' '}
            <Link
              href="/register"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Regisztrálj
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </Suspense>
  );
}
