import { Header } from '@/components/header';
import { NavItemsDynamic } from '@/components/nav-items-dynamic';

export default function Home() {
  return (
    <>
      <Header>
        <NavItemsDynamic />
      </Header>
      <main className="px-4 py-2">
        <h2>Home Page</h2>
      </main>
    </>
  );
}
