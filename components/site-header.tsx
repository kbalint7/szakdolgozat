import { connection } from 'next/server';
import { Suspense } from 'react';

import { LinkButton } from '@/components/link-button';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { UserMenu } from '@/components/user-menu';
import { getSession } from '@/lib/auth/session';

async function HeaderAuth() {
  await connection();
  const session = await getSession();
  if (!session) {
    return (
      <>
        <LinkButton href="/login" variant="ghost">
          Bejelentkezés
        </LinkButton>
        <LinkButton href="/register" className="hidden sm:inline-flex">
          Regisztráció
        </LinkButton>
      </>
    );
  }
  const { name, email, isPlatformAdmin } = session.user;
  return (
    <>
      <LinkButton href="/dashboard" variant="outline" className="hidden sm:inline-flex">
        Vezérlőpult
      </LinkButton>
      <UserMenu user={{ name, email, isPlatformAdmin }} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Logo compact />
        <nav className="flex items-center gap-1 text-sm" aria-label="Fő navigáció">
          <LinkButton href="/products" variant="ghost">
            Termékek
          </LinkButton>
          <LinkButton href="/#hogyan-mukodik" variant="ghost" className="hidden md:inline-flex">
            Hogyan működik?
          </LinkButton>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ModeToggle />
          <Suspense fallback={<Skeleton className="h-8 w-40" />}>
            <HeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
