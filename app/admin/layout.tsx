import { AppHeader } from '@/components/shell/app-header';
import { AppShell } from '@/components/shell/app-shell';
import { Breadcrumbs } from '@/components/shell/breadcrumbs';
import { MobileNav } from '@/components/shell/mobile-nav';
import { NavLinks } from '@/components/shell/nav-links';
import { Sidebar } from '@/components/shell/sidebar';

import { adminNav } from './nav';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <AppShell
      sidebar={
        <Sidebar>
          <NavLinks sections={adminNav} />
        </Sidebar>
      }
      header={
        <AppHeader
          menu={
            <MobileNav title="Platform admin">
              <NavLinks sections={adminNav} />
            </MobileNav>
          }
          breadcrumbs={<Breadcrumbs />}
        />
      }
    >
      {children}
    </AppShell>
  );
}
