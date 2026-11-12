import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';
import { PageHeader } from '@/components/page-header';
import { loadAuditPage } from '@/lib/audit-page';
import { getCompanyContext } from '@/lib/auth/company';

export const metadata: Metadata = { title: 'Auditnapló' };

export default async function CompanyAuditPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/audit'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('audit.view')) return <AccessDenied />;

  const company = `/dashboard/companies/${companyId}`;
  const base = `${company}/audit`;
  const { filter, filtered, entries, more } = await loadAuditPage(companyId, await searchParams, base);

  return (
    <>
      <PageHeader
        trail={[{ href: company, label: ctx.company.name }]}
        trailMobileOnly
        title="Auditnapló"
        description="Ki mit változtatott és miért. A bejegyzéseket utólag senki sem módosíthatja."
      />
      <div className="flex flex-col gap-4">
        <AuditFilters values={filter} resetHref={base} />
        <AuditTable
          entries={entries}
          filtered={filtered}
          employeeHref={employeeId => `${company}/employees/${employeeId}`}
          eventHref={
            ctx.can('hrEvents.view')
              ? event => `${company}/events?${new URLSearchParams({ q: event.hrId, event: event.id })}`
              : undefined
          }
          more={more}
        />
      </div>
    </>
  );
}
