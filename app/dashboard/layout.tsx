import { cache, Suspense } from 'react';

import { AppHeader } from '@/components/shell/app-header';
import { AppShell } from '@/components/shell/app-shell';
import { Breadcrumbs } from '@/components/shell/breadcrumbs';
import { MobileNav } from '@/components/shell/mobile-nav';
import { Sidebar } from '@/components/shell/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getSession } from '@/lib/auth/session';

import { DashboardNav } from './dashboard-nav';

const getNavData = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return { isPlatformAdmin: session.user.isPlatformAdmin };
});

async function DashboardNavLoader() {
  const data = await getNavData();
  if (!data) return null;
  return <DashboardNav isPlatformAdmin={data.isPlatformAdmin} />;
}

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-1" aria-busy="true">
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const nav = (
    <Suspense fallback={<NavSkeleton />}>
      <DashboardNavLoader />
    </Suspense>
  );
  return (
    <AppShell
      sidebar={<Sidebar>{nav}</Sidebar>}
      header={<AppHeader menu={<MobileNav>{nav}</MobileNav>} breadcrumbs={<Breadcrumbs />} />}
    >
      {children}
    </AppShell>
  );
}
