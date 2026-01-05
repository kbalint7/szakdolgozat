import { Header } from '@/components/header';
import { NavItemsLoggedIn } from '@/components/nav-items-logged-in';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header>
        <NavItemsLoggedIn />
      </Header>
      <main className="px-4 py-2">{children}</main>
    </>
  );
}
