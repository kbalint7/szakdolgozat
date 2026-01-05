import { verifySession } from '@/lib/dal';
import { redirect } from 'next/navigation';

export async function DashboardGreet() {
  const session = await verifySession();

  if (!session) {
    redirect('/login');
  }

  return <h2>Welcome back, {session.user.name}!</h2>;
}
