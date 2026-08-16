import { UsersIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { StatCard, StatGrid } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { getCompanyContext } from '@/lib/auth/company';
import { roleLabels } from '@/lib/domain/permissions';
import { listMembers } from '@/lib/services/companies';

export const metadata: Metadata = { title: 'Cég áttekintése' };

export default async function CompanyOverviewPage({ params }: PageProps<'/dashboard/companies/[companyId]'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  const members = await listMembers(companyId);
  const base = `/dashboard/companies/${companyId}`;

  return (
    <>
      <PageHeader
        eyebrow="Cég"
        title={ctx.company.name}
        description={ctx.company.description || undefined}
        meta={
          <>
            <Badge variant={ctx.role === 'member' ? 'secondary' : 'default'}>{roleLabels[ctx.role]}</Badge>
            <span className="nums text-xs text-muted-foreground">{members.length} tag</span>
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Tagok"
          value={members.length}
          icon={<UsersIcon />}
          tone="primary"
          href={ctx.can('members.view') ? `${base}/members` : undefined}
        />
      </StatGrid>
    </>
  );
}
