import { connection } from 'next/server';
import { Suspense } from 'react';

import { LinkButton } from '@/components/link-button';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { SiteMenu, SiteNav } from '@/components/site-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getSession } from '@/lib/auth/session';

const navLinks = [
  { href: '/products', label: 'Termékek' },
  { href: '/#hogyan-mukodik', label: 'Hogyan működik?' },
];

async function HeaderAuth() {
  await connection();
  const session = await getSession();
  if (!session) {
    return (
      <>
        <LinkButton href="/login" variant="ghost" className="hidden md:inline-flex">
          Bejelentkezés
        </LinkButton>
        <LinkButton href="/register" className="hidden md:inline-flex">
          Regisztráció
        </LinkButton>
        <SiteMenu
          links={[
            ...navLinks,
            { href: '/login', label: 'Bejelentkezés' },
            { href: '/register', label: 'Regisztráció' },
          ]}
        />
      </>
    );
  }
  return (
    <>
      <LinkButton href="/dashboard" variant="outline" className="hidden md:inline-flex">
        Vezérlőpult
      </LinkButton>
      <SiteMenu links={[...navLinks, { href: '/dashboard', label: 'Vezérlőpult' }]} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Logo />
        <SiteNav links={navLinks} />
        <div className="ml-auto flex items-center gap-1.5">
          <ModeToggle />
          <Suspense fallback={<Skeleton className="size-8 md:w-[13.375rem]" />}>
            <HeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
