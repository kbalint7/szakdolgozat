import { ShieldCheckIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatTimestamp } from '@/lib/format';
import { checkReasonLabels, label } from '@/lib/i18n/labels';
import { listRecentChecks } from '@/lib/services/license-check';

export const metadata: Metadata = { title: 'Ellenőrzések' };

export default async function ChecksPage({ params }: PageProps<'/dashboard/companies/[companyId]/checks'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('checks.view')) return <AccessDenied />;
  const checks = await listRecentChecks(companyId);
  const denied = checks.filter(check => !check.allowed).length;

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Ellenőrzések"
        description="Ki, mikor próbálta használni a cég szoftvereit, és mi lett az eredmény."
        meta={
          checks.length > 0 && (
            <>
              <StatusBadge tone="success" dot={false}>
                {checks.length - denied} engedélyezve
              </StatusBadge>
              <StatusBadge tone={denied > 0 ? 'danger' : 'neutral'} dot={false}>
                {denied} elutasítva
              </StatusBadge>
            </>
          )
        }
      />
      {checks.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon />}
          title="Még nem volt ellenőrzés"
          description="Az ellenőrzések akkor jelennek meg, amikor a kliens szoftver lekérdezi a jogosultságot."
        />
      ) : (
        <TableCard footer={<span className="text-muted-foreground">A legutóbbi {checks.length} ellenőrzés.</span>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Időpont</TableHead>
                <TableHead>Felhasználó</TableHead>
                <TableHead>Termék</TableHead>
                <TableHead>Eredmény</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map(check => (
                <TableRow key={check.id}>
                  <TableCell className="nums text-xs text-muted-foreground">
                    {formatTimestamp(check.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{check.userName ?? '–'}</div>
                    {check.userEmail && <div className="text-xs text-muted-foreground">{check.userEmail}</div>}
                  </TableCell>
                  <TableCell>{check.productName ?? check.productSlug}</TableCell>
                  <TableCell>
                    {check.allowed ? (
                      <StatusBadge tone="success">Engedélyezve</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">Elutasítva: {label(checkReasonLabels, check.reason)}</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
      <Callout tone="note" title="Mikor használhatja valaki a szoftvert?">
        Ha a fiókja össze van kapcsolva a munkavállalói adataival, van kiosztott helye az adott szoftverhez, és a hely
        érvényes licenchez tartozik. Elutasításnál az okot is látod.
      </Callout>
    </>
  );
}
