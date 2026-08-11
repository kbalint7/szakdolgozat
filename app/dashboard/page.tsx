import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Vezérlőpult' };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <PageHeader
      eyebrow="Vezérlőpult"
      title={`Üdv, ${user.name}!`}
      description="Itt találod a cégeidet és a hozzáféréseidet."
    />
  );
}
