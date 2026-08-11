import { AppHeader } from '@/components/shell/app-header';
import { AppShell } from '@/components/shell/app-shell';
import { Breadcrumbs } from '@/components/shell/breadcrumbs';
import { MobileNav } from '@/components/shell/mobile-nav';
import { Sidebar } from '@/components/shell/sidebar';

import { DashboardNav } from './dashboard-nav';

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const nav = <DashboardNav />;
  return (
    <AppShell
      sidebar={<Sidebar>{nav}</Sidebar>}
      header={<AppHeader menu={<MobileNav>{nav}</MobileNav>} breadcrumbs={<Breadcrumbs />} />}
    >
      {children}
    </AppShell>
  );
}
