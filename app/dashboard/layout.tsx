import { cache, Suspense } from 'react';

import { AppHeader } from '@/components/shell/app-header';
import { AppShell } from '@/components/shell/app-shell';
import { MobileNav } from '@/components/shell/mobile-nav';
import { Sidebar, SidebarAccount } from '@/components/shell/sidebar';
import { ViewerRoleProvider } from '@/components/shell/viewer-role';
import { Skeleton } from '@/components/ui/skeleton';
import { getSession } from '@/lib/auth/session';
import { listMyCompanies } from '@/lib/services/companies';

import { DashboardNav } from './dashboard-nav';

const getNavData = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const companies = await listMyCompanies(session.user.id);
  return {
    companies: companies.map(({ id, name, role }) => ({ id, name, role })),
    isPlatformAdmin: session.user.isPlatformAdmin,
  };
});

async function DashboardNavLoader() {
  const data = await getNavData();
  if (!data) return null;
  return <DashboardNav companies={data.companies} isPlatformAdmin={data.isPlatformAdmin} />;
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
    <ViewerRoleProvider>
      <AppShell
        sidebar={<Sidebar>{nav}</Sidebar>}
        header={<AppHeader menu={<MobileNav account={<SidebarAccount />}>{nav}</MobileNav>} />}
      >
        {children}
      </AppShell>
    </ViewerRoleProvider>
  );
}
