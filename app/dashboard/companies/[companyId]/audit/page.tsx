import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';
import { PageHeader } from '@/components/page-header';
import { loadAuditPage } from '@/lib/audit-page';
import { getCompanyContext } from '@/lib/auth/company';

export const metadata: Metadata = { title: 'Audit napló' };

export default async function CompanyAuditPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/audit'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('audit.view')) return <AccessDenied />;

  const base = `/dashboard/companies/${companyId}/audit`;
  const { filter, entries, olderHref } = await loadAuditPage(companyId, await searchParams, base);

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Audit napló"
        description="Minden változás: ki hajtotta végre, és mi váltotta ki. A bejegyzések utólag nem módosíthatók."
      />
      <AuditFilters values={filter} resetHref={base} />
      <AuditTable
        entries={entries}
        employeeHref={employeeId => `/dashboard/companies/${companyId}/employees/${employeeId}`}
        olderHref={olderHref}
      />
    </>
  );
}
