import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

import { NavButton } from '@/components/nav-button';
import { Suspense } from 'react';
import { NavItemsSkeleton } from './nav-items-skeleton';

export async function Header({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <header className="bg-background h-12 p-2 border-b sticky top-0 z-20">
      <div className="flex h-8 items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <NavButton href="/" label="Home" icon={HomeIcon} />
          <Link href="/" className="flex justify-center items-center gap-2 ml-0" title="Home">
            <h1 className="hidden sm:block text-xl font-bold m-0 mt-1">Licenszkezelő</h1>
          </Link>
        </div>
        <Suspense fallback={<NavItemsSkeleton />}>{children}</Suspense>
      </div>
    </header>
  );
}
