import { Suspense } from 'react';

import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { UserMenu } from '@/components/user-menu';
import { getSession } from '@/lib/auth/session';

async function Account() {
  const session = await getSession();
  if (!session) return null;
  const { name, email } = session.user;
  return <UserMenu variant="row" user={{ name, email }} />;
}

export function SidebarAccount() {
  return (
    <div className="shrink-0 border-t border-sidebar-border p-2">
      <Suspense fallback={<Skeleton className="h-10 w-full rounded-lg" />}>
        <Account />
      </Suspense>
    </div>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center px-5">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4">{children}</div>
      <SidebarAccount />
    </>
  );
}
