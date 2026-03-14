import { Header } from '@/components/navigation/header';
import { NavItemsDynamic } from '@/components/navigation/nav-items-dynamic';

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
