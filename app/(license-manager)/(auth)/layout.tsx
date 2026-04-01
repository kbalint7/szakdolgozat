import { Header } from '@/components/navigation/header';
import { NavItems } from '@/components/navigation/nav-items';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header>
        <NavItems />
      </Header>
      <main className="px-4 py-2">{children}</main>
    </>
  );
}
