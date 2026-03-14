import { Header } from '@/components/navigation/header';
import { NavItemsLoggedIn } from '@/components/navigation/nav-items-logged-in';

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
