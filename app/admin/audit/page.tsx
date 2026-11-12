import type { Metadata } from 'next';

import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';
import { PageHeader } from '@/components/page-header';
import { loadAuditPage } from '@/lib/audit-page';
import { requirePlatformAdmin } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Auditnapló' };

export default async function GlobalAuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requirePlatformAdmin();
  const { filter, filtered, entries, more } = await loadAuditPage(null, await searchParams, '/admin/audit');

  return (
    <>
      <PageHeader title="Auditnapló" description="Ki mit változtatott és miért, az összes cégben és a platformon." />
      <div className="flex flex-col gap-4">
        <AuditFilters values={filter} resetHref="/admin/audit" search="company" />
        <AuditTable entries={entries} filtered={filtered} showCompany more={more} />
      </div>
    </>
  );
}
