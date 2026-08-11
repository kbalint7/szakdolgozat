import { Suspense } from 'react';

import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { UserMenu } from '@/components/user-menu';
import { getSession } from '@/lib/auth/session';

async function HeaderUser() {
  const session = await getSession();
  if (!session) return null;
  const { name, email, isPlatformAdmin } = session.user;
  return <UserMenu user={{ name, email, isPlatformAdmin }} />;
}

export function AppHeader({ menu, breadcrumbs }: { menu?: React.ReactNode; breadcrumbs?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="flex h-14 w-full items-center gap-3 px-4 md:px-8">
        {menu}
        <div className="md:hidden">
          <Logo href="/dashboard" compact />
        </div>
        <div className="hidden min-w-0 flex-1 md:block">{breadcrumbs}</div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ModeToggle />
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <HeaderUser />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
