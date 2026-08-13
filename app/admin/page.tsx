import { redirect } from 'next/navigation';

import { requirePlatformAdmin } from '@/lib/auth/session';

export default async function AdminPage() {
  await requirePlatformAdmin();
  redirect('/admin/products');
}
