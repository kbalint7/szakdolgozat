import { cn } from 'cn';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SeatLegend, SeatMeter } from '@/components/seat-map';
import { Section } from '@/components/section';
import { Narrow } from '@/components/split-layout';
import { ActionHead, ChevronCell, EmptyRow, TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDateTime, formatUntil } from '@/lib/format';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import { getPoolDetail } from '@/lib/services/pool-queries';
import { isUuid } from '@/lib/validation/ids';

import { linkedDot, unlinkedDot } from '../../employees/account-mark';

export const metadata: Metadata = { title: 'Helyek' };

type PoolEmployee = { id: string; hrId: string; name: string | null; jobRole: string; linked: boolean };

const DEFAULT_REASON = 'RULE_MATCHED';

function SeatRow({
  href,
  position,
  employee,
  at,
  atLabel,
  showRole,
  note,
  linkedMark,
}: {
  href: string | null;
  position: number;
  employee: PoolEmployee;
  at: Date | null;
  atLabel: string;
  showRole: boolean;
  note: React.ReactNode;
  linkedMark: boolean;
}) {
  const name = employee.name ?? 'Név nélkül';
  const nameClass = cn('min-w-0 truncate font-medium', !employee.name && 'font-normal text-muted-foreground');
  const facts = [employee.hrId, showRole && employee.jobRole];
  return (
    <TableRow className="relative">
      <TableCell className="nums pr-0 text-right align-top text-muted-foreground">
        <span className="leading-5">{position}.</span>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2 leading-5">
          {linkedMark && <span aria-hidden className={employee.linked ? linkedDot : unlinkedDot} />}
          {href ? (
            <Link
              href={href}
              className={cn(
                nameClass,
                'outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset',
              )}
            >
              {name}
            </Link>
          ) : (
            <span className={nameClass}>{name}</span>
          )}
          {linkedMark && <span className="sr-only">{employee.linked ? '(van fiókja)' : '(nincs fiókja)'}</span>}
        </div>
        <div className={cn(linkedMark && 'pl-4')}>
          <MetaLine className="leading-4 max-lg:hidden" items={[...facts, note]} />
          <MetaLine
            className="leading-4 lg:hidden"
            items={[...facts, at && `${atLabel}: ${formatDateTime(at)}`, note]}
          />
        </div>
      </TableCell>
      <TableCell className="nums hidden text-muted-foreground lg:table-cell">{formatDateTime(at)}</TableCell>
      {href && <ChevronCell />}
    </TableRow>
  );
}

export default async function PoolPage({ params }: PageProps<'/dashboard/companies/[companyId]/licenses/[productId]'>) {
  const { companyId, productId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('licenses.view')) return <AccessDenied />;
  const pool = isUuid(productId) ? await getPoolDetail(companyId, productId) : null;
  if (!pool) notFound();

  const base = `/dashboard/companies/${companyId}`;
  const assigned = pool.assigned.length;
  const waiting = pool.waitlist.length;
  const free = Math.max(0, pool.capacity - assigned);
  const overCapacity = pool.assigned.some(seat => !seat.withinCapacity);
  const unlinked = pool.assigned.filter(seat => !seat.employee.linked).length;

  const everyone = [...pool.assigned.map(seat => seat.employee), ...pool.waitlist.map(entry => entry.employee)];
  const showRole = new Set(everyone.map(employee => employee.jobRole)).size > 1;
  const canOpen = ctx.can('employees.view');
  const employeeHref = (employee: PoolEmployee) => (canOpen ? `${base}/employees/${employee.id}` : null);

  const head = (date: string) => (
    <TableHeader className="max-md:hidden">
      <TableRow>
        <TableHead className="w-px pr-0 text-right md:w-12">#</TableHead>
        <TableHead className="w-full md:w-auto lg:w-96">Munkavállaló</TableHead>
        <TableHead className={cn('hidden lg:table-cell', canOpen && 'lg:w-44')}>{date}</TableHead>
        {canOpen && <ActionHead label="Megnyitás" className="md:max-lg:w-12" />}
      </TableRow>
    </TableHeader>
  );

  return (
    <>
      <PageHeader
        trail={[
          { href: base, label: ctx.company.name },
          { href: `${base}/licenses`, label: 'Licencek és helyek' },
        ]}
        title={pool.product.name}
        description="Ki kapott helyet ebből a szoftverből, és ki vár rá."
      />

      <Narrow>
        <div className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-border">
          <SeatMeter
            size="lg"
            assigned={assigned}
            capacity={pool.capacity}
            waiting={waiting}
            label={pool.product.name}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5">
            <SeatLegend free={free > 0} waiting={waiting > 0} />
            <span className="nums text-[13px] whitespace-nowrap text-muted-foreground">
              Érvényes {pool.earliestExpiry ? formatUntil(pool.earliestExpiry) : 'határozatlan ideig'}
            </span>
          </div>
        </div>

        {overCapacity && (
          <Callout tone="warning" title="Kevesebb a hely, mint ahányan kaptak">
            Lejárt egy licenc. Akik utoljára kaptak helyet, már nem használhatják a szoftvert, és hamarosan
            visszakerülnek a várólistára.
          </Callout>
        )}

        {waiting > 0 && (
          <Section title="Várólista" count={waiting} description="Aki régebb óta vár, az kap előbb helyet.">
            <TableCard>
              <Table>
                {head('Mióta vár')}
                <TableBody>
                  {pool.waitlist.map(entry => (
                    <SeatRow
                      key={entry.id}
                      href={employeeHref(entry.employee)}
                      position={entry.position}
                      employee={entry.employee}
                      at={entry.eligibleSince}
                      atLabel="ezóta vár"
                      showRole={showRole}
                      linkedMark={false}
                      note={entry.queueReason !== DEFAULT_REASON && seatReasonLabel(entry.queueReason)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </Section>
        )}

        <Section title="Kiosztott helyek" count={assigned}>
          {unlinked > 0 && (
            <div className="nums flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className={linkedDot} /> van fiókja, használhatja ({assigned - unlinked})
              </span>
              <span className="flex items-center gap-1.5">
                <span className={unlinkedDot} /> még nincs fiókja ({unlinked})
              </span>
            </div>
          )}
          <TableCard>
            {assigned === 0 ? (
              <EmptyRow>Még senki sem kapott helyet.</EmptyRow>
            ) : (
              <Table>
                {head('Kiosztva')}
                <TableBody>
                  {pool.assigned.map(seat => (
                    <SeatRow
                      key={seat.id}
                      href={employeeHref(seat.employee)}
                      position={seat.rank}
                      employee={seat.employee}
                      at={seat.assignedAt}
                      atLabel="kiosztva"
                      showRole={showRole}
                      linkedMark={unlinked > 0}
                      note={
                        !seat.withinCapacity ? (
                          <span className="text-destructive">már nem használhatja</span>
                        ) : (
                          seat.grantReason !== DEFAULT_REASON && seatReasonLabel(seat.grantReason)
                        )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </TableCard>
        </Section>
      </Narrow>
    </>
  );
}
