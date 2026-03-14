import { verifySession } from '@/lib/dal';
import { NavItems } from './nav-items';
import { NavItemsLoggedIn } from './nav-items-logged-in';

export async function NavItemsDynamic() {
  const session = await verifySession();

  return session ? <NavItemsLoggedIn /> : <NavItems />;
}
