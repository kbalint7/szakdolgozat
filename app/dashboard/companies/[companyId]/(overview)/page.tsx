import { ArmchairIcon, ChevronRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Callout } from '@/components/callout';
import { Ident } from '@/components/code';
import { Detail, DetailAction, DetailList } from '@/components/detail-list';
import { EmptyState } from '@/components/empty-state';
import { RowAction } from '@/components/forms/row-action';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import { SeatMeter } from '@/components/seat-map';
import { Section } from '@/components/section';
import { SoftwareStatus } from '@/components/software-status';
import { Narrow } from '@/components/split-layout';
import { Stat, StatStrip } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyRow, TableCard, TwoLine } from '@/components/table-card';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext, type CompanyContext } from '@/lib/auth/company';
import { roleLabels } from '@/lib/domain/permissions';
import { formatUntil } from '@/lib/format';
import { getMySoftware } from '@/lib/services/license-check';
import { getCompanyOverview, getMemberOverview } from '@/lib/services/overview';

import { leaveCompanyAction } from '../../actions';

import { ManagerBodySkeleton, MemberBodySkeleton } from './body-skeletons';

export const metadata: Metadata = { title: 'Cég áttekintése' };

export default async function CompanyOverviewPage({ params }: PageProps<'/dashboard/companies/[companyId]'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);

  if (!ctx.can('licenses.view')) {
    return (
      <>
        <PageHeader title={ctx.company.name} description={ctx.company.description || undefined} />
        <Suspense fallback={<MemberBodySkeleton />}>
          <MemberBody ctx={ctx} />
        </Suspense>
      </>
    );
  }

  return (
    <Narrow>
      <PageHeader
        title={ctx.company.name}
        description={ctx.company.description || undefined}
        actions={<LinkButton href="/products">Vásárlás</LinkButton>}
      />
      <Suspense fallback={<ManagerBodySkeleton />}>
        <ManagerBody companyId={companyId} />
      </Suspense>
    </Narrow>
  );
}

async function ManagerBody({ companyId }: { companyId: string }) {
  const overview = await getCompanyOverview(companyId);
  const base = `/dashboard/companies/${companyId}`;
  const waiting = overview.pools.reduce((sum, pool) => sum + pool.waiting, 0);
  const waitingPools = overview.pools.filter(pool => pool.waiting > 0);
  const waitingHref = waitingPools.length === 1 ? `${base}/licenses/${waitingPools[0].productId}` : `${base}/licenses`;

  return (
    <>
      {overview.failedEvents > 0 && (
        <Callout tone="warning" title={`${overview.failedEvents} HR-eseményt nem sikerült feldolgozni`}>
          {overview.retryingEvents === overview.failedEvents && <>Hamarosan újra megpróbáljuk. </>}
          {overview.retryingEvents === 0 && <>Automatikusan már nem próbáljuk újra. </>}
          <Link
            href={`${base}/events?status=failed`}
            className="font-medium whitespace-nowrap text-foreground underline underline-offset-4"
          >
            Sikertelen események megnyitása
          </Link>
        </Callout>
      )}

      <StatStrip>
        <Stat label="Tagok" value={overview.memberCount} href={`${base}/members`} />
        <Stat label="Aktív munkavállalók" value={overview.activeEmployeeCount} href={`${base}/employees`} />
        <Stat label="Várólistán" value={waiting} tone={waiting > 0 ? 'warning' : 'default'} href={waitingHref} />
      </StatStrip>

      <Section title="Helyek szoftverenként">
        {overview.pools.length === 0 ? (
          <EmptyState
            icon={<ArmchairIcon />}
            title="Még nincs licenc"
            description="Vásárolj vagy aktiválj egy licencet, és add meg, melyik munkakörnek jár a szoftver."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {overview.pools.map(pool => (
              <li key={pool.productId}>
                <Link
                  href={`${base}/licenses/${pool.productId}`}
                  className="flex items-center gap-4 rounded-xl bg-card py-4 pr-4 pl-5 shadow-card ring-1 ring-border transition-shadow outline-none hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-semibold tracking-tight">{pool.productName}</span>
                        {pool.ruleCount === 0 && <StatusBadge tone="warning">Nincs szabály</StatusBadge>}
                      </div>
                      {pool.capacity > 0 && (
                        <span className="nums text-[13px] whitespace-nowrap text-muted-foreground">
                          {pool.earliestExpiry ? formatUntil(pool.earliestExpiry) : 'határozatlan ideig'}
                        </span>
                      )}
                    </div>
                    <SeatMeter
                      assigned={pool.assigned}
                      capacity={pool.capacity}
                      waiting={pool.waiting}
                      label={pool.productName}
                    />
                  </div>
                  <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

async function MemberBody({ ctx }: { ctx: CompanyContext }) {
  const companyId = ctx.company.id;
  const [{ employee, managers }, software] = await Promise.all([
    getMemberOverview(companyId, ctx.membershipId),
    getMySoftware(ctx.user.id),
  ]);
  const rows = software.rows.filter(row => row.companyId === companyId);

  return (
    <Narrow>
      <Card>
        <CardContent>
          <DetailList className="sm:grid-cols-2">
            <Detail label="Szerepkör">{roleLabels[ctx.role]}</Detail>
            <Detail label="A céget kezeli">{managers.map(manager => manager.name).join(', ')}</Detail>
            <Detail label="Munkavállalói adatok">
              {employee ? (
                <span className="flex flex-wrap items-baseline gap-x-2">
                  {employee.name ?? <span className="text-muted-foreground">Név nélkül</span>}
                  <Ident>{employee.hrId}</Ident>
                  {employee.status !== 'active' && <span className="text-muted-foreground">Kilépett</span>}
                </span>
              ) : (
                <StatusBadge tone="warning">Nincs összekapcsolva</StatusBadge>
              )}
            </Detail>
            {employee && <Detail label="Munkakör">{employee.jobRole || '–'}</Detail>}
          </DetailList>
          {ctx.can('company.leave') && (
            <DetailAction>
              <RowAction
                destructive
                className="mr-0 -ml-2.5"
                action={leaveCompanyAction.bind(null, companyId)}
                confirm={{
                  title: 'Kilépsz a cégből?',
                  description:
                    rows.length > 0
                      ? 'A szoftvereidet nem tudod tovább használni, és csak új meghívóval csatlakozhatsz újra.'
                      : 'Csak új meghívóval csatlakozhatsz újra.',
                  confirmLabel: 'Kilépés',
                  destructive: true,
                }}
              >
                Kilépés a cégből
              </RowAction>
            </DetailAction>
          )}
        </CardContent>
      </Card>

      <Section title="Szoftvereim" count={rows.length > 0 ? rows.length : undefined}>
        <TableCard>
          {rows.length === 0 ? (
            <EmptyRow>
              {employee
                ? 'Még nincs szoftvered. Akkor kapsz helyet, ha ennél a cégnél a munkakörödhöz jár szoftver.'
                : 'A fiókod nincs összekapcsolva munkavállalói adatokkal, ezért nem tudod használni a cég szoftvereit. Ha a cég munkavállalója vagy, kérd meg az adminisztrátort, hogy kapcsolja össze.'}
            </EmptyRow>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full md:w-60 lg:w-64">Szoftver</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-44">Érvényes</TableHead>
                  <TableHead>Állapot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const validity = row.validUntil ? formatUntil(row.validUntil) : 'határozatlan ideig';
                  return (
                    <TableRow key={row.productId}>
                      <TableCell className="max-md:whitespace-normal">
                        <span className="block truncate font-medium max-lg:hidden">{row.productName}</span>
                        <TwoLine
                          className="lg:hidden"
                          title={<span className="block md:truncate">{row.productName}</span>}
                          sub={validity}
                        />
                      </TableCell>
                      <TableCell className="nums hidden text-muted-foreground lg:table-cell">{validity}</TableCell>
                      <TableCell>
                        <SoftwareStatus row={row} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableCard>
      </Section>
    </Narrow>
  );
}
