import type { Metadata } from 'next';

import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';
import { PageHeader } from '@/components/page-header';
import { loadAuditPage } from '@/lib/audit-page';
import { requirePlatformAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Globális audit napló' };

export default async function GlobalAuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requirePlatformAdmin();
  const { filter, entries, olderHref } = await loadAuditPage(null, await searchParams, '/admin/audit');

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Globális audit napló"
        description="Az összes cég és a platform minden változása: ki hajtotta végre, és mi váltotta ki."
      />
      <AuditFilters values={filter} resetHref="/admin/audit" />
      <AuditTable entries={entries} showCompany olderHref={olderHref} />
    </>
  );
}
