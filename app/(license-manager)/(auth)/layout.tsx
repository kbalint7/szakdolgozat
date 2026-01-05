import { Header } from '@/components/header';
import { NavItems } from '@/components/nav-items';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header>
        <NavItems />
      </Header>
      <main className="px-4 py-2">{children}</main>
    </>
  );
}
