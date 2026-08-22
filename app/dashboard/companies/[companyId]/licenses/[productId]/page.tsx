import { ArmchairIcon, HourglassIcon, LayersIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { CapacityMeter } from '@/components/capacity-meter';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatCard, StatGrid } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDate, formatTimestamp } from '@/lib/format';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import { getPoolDetail } from '@/lib/services/pool-queries';
import { isUuid } from '@/lib/validation/ids';

export const metadata: Metadata = { title: 'Helyek' };

function EmployeeCell({
  companyId,
  employee,
}: {
  companyId: string;
  employee: { id: string; hrId: string; name: string | null; linked: boolean };
}) {
  return (
    <TableCell>
      <Link href={`/dashboard/companies/${companyId}/employees/${employee.id}`} className="font-medium hover:underline">
        {employee.name ?? employee.hrId}
      </Link>
      <div className="font-mono text-xs text-muted-foreground">{employee.hrId}</div>
    </TableCell>
  );
}

export default async function PoolPage({ params }: PageProps<'/dashboard/companies/[companyId]/licenses/[productId]'>) {
  const { companyId, productId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('licenses.view')) return <AccessDenied />;
  const pool = isUuid(productId) ? await getPoolDetail(companyId, productId) : null;
  if (!pool) notFound();

  const free = Math.max(0, pool.capacity - pool.assigned.length);

  return (
    <>
      <PageHeader
        back={{ href: `/dashboard/companies/${companyId}/licenses`, label: 'Licencek és helyek' }}
        eyebrow="Helyek"
        title={pool.product.name}
        description={
          pool.earliestExpiry ? `Legkorábbi lejárat: ${formatDate(pool.earliestExpiry)}.` : 'A licencek nem járnak le.'
        }
      />

      <StatGrid>
        <StatCard label="Összes hely" value={pool.capacity} icon={<LayersIcon />} tone="primary" />
        <StatCard label="Kiosztva" value={pool.assigned.length} icon={<ArmchairIcon />} tone="success" />
        <StatCard label="Szabad" value={free} icon={<ArmchairIcon />} />
        <StatCard
          label="Várólistán"
          value={pool.waitlist.length}
          icon={<HourglassIcon />}
          tone={pool.waitlist.length > 0 ? 'warning' : 'default'}
        />
      </StatGrid>
      <div className="rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Kihasználtság</span>
          <span className="nums text-muted-foreground">
            {pool.assigned.length} / {pool.capacity} hely
          </span>
        </div>
        <CapacityMeter
          assigned={pool.assigned.length}
          capacity={pool.capacity}
          waiting={pool.waitlist.length}
          label={pool.product.name}
        />
      </div>

      <Section title="Várólista" description="Érkezési sorrendben: aki korábban lett jogosult, az kap előbb helyet.">
        {pool.waitlist.length === 0 ? (
          <EmptyState compact icon={<HourglassIcon />} title="Senki sem vár helyre" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-0 text-right">#</TableHead>
                  <TableHead>Munkavállaló</TableHead>
                  <TableHead>Munkakör</TableHead>
                  <TableHead>Jogosult ettől</TableHead>
                  <TableHead>Ok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pool.waitlist.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="nums text-right font-medium">{entry.position}.</TableCell>
                    <EmployeeCell companyId={companyId} employee={entry.employee} />
                    <TableCell>
                      <Mono>{entry.employee.jobRole}</Mono>
                    </TableCell>
                    <TableCell className="nums">{formatTimestamp(entry.eligibleSince)}</TableCell>
                    <TableCell>
                      {entry.queueReason === 'CAPACITY_REDUCED' ? (
                        <StatusBadge tone="warning" dot={false}>
                          {seatReasonLabel(entry.queueReason)}
                        </StatusBadge>
                      ) : (
                        <span className="text-muted-foreground">{seatReasonLabel(entry.queueReason)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <Section
        title="Kiosztott helyek"
        description="A kiosztás sorrendjében. Ha csökken a helyek száma, a legutóbb helyet kapottak kerülnek vissza a várólistára."
      >
        {pool.assigned.length === 0 ? (
          <EmptyState compact icon={<ArmchairIcon />} title="Még senki sem kapott helyet" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-0 text-right">#</TableHead>
                  <TableHead>Munkavállaló</TableHead>
                  <TableHead>Munkakör</TableHead>
                  <TableHead>Kiosztva</TableHead>
                  <TableHead>Ok</TableHead>
                  <TableHead>Állapot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pool.assigned.map(seat => (
                  <TableRow key={seat.id}>
                    <TableCell className="nums text-right">{seat.rank}.</TableCell>
                    <EmployeeCell companyId={companyId} employee={seat.employee} />
                    <TableCell>
                      <Mono>{seat.employee.jobRole}</Mono>
                    </TableCell>
                    <TableCell className="nums">{formatTimestamp(seat.assignedAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{seatReasonLabel(seat.grantReason)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {seat.withinCapacity && seat.employee.linked && (
                          <StatusBadge tone="success">használható</StatusBadge>
                        )}
                        {!seat.withinCapacity && <StatusBadge tone="danger">nincs rá hely</StatusBadge>}
                        {!seat.employee.linked && <StatusBadge tone="neutral">nincs fiókhoz kapcsolva</StatusBadge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <Callout tone="note" title="Mit jelent, hogy „nincs rá hely”?">
        Ha egy licenc lejárt, és kevesebb hely maradt, mint ahányan kaptak, a legutóbb helyet kapottak nem használhatják
        a szoftvert, amíg újra nem lesz szabad hely. A rendszer rövidesen automatikusan visszateszi őket a várólistára.
      </Callout>
    </>
  );
}
