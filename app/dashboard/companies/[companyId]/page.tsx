import { ArmchairIcon, ArrowRightIcon, ContactIcon, HourglassIcon, ListChecksIcon, UsersIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout } from '@/components/callout';
import { CapacityMeter } from '@/components/capacity-meter';
import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatCard, StatGrid } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { getCompanyContext } from '@/lib/auth/company';
import { roleLabels } from '@/lib/domain/permissions';
import { formatDate } from '@/lib/format';
import { getCompanyOverview } from '@/lib/services/overview';

export const metadata: Metadata = { title: 'Cég áttekintése' };

export default async function CompanyOverviewPage({ params }: PageProps<'/dashboard/companies/[companyId]'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  const isAdmin = ctx.can('licenses.view');
  const overview = await getCompanyOverview(companyId);
  const base = `/dashboard/companies/${companyId}`;
  const assigned = overview.pools.reduce((sum, pool) => sum + pool.assigned, 0);
  const waiting = overview.pools.reduce((sum, pool) => sum + pool.waiting, 0);

  return (
    <>
      <PageHeader
        eyebrow="Cég"
        title={ctx.company.name}
        description={ctx.company.description || undefined}
        meta={
          <>
            <Badge variant={ctx.role === 'member' ? 'secondary' : 'default'}>{roleLabels[ctx.role]}</Badge>
            <span className="nums text-xs text-muted-foreground">{overview.memberCount} tag</span>
          </>
        }
        actions={
          isAdmin && (
            <>
              <LinkButton href={`${base}/rules`} variant="outline">
                <ListChecksIcon data-icon="inline-start" /> Szabályok
              </LinkButton>
              <LinkButton href="/products">Vásárlás</LinkButton>
            </>
          )
        }
      />

      {isAdmin && overview.failedEvents > 0 && (
        <Callout tone="warning" title={`${overview.failedEvents} HR-változást nem sikerült feldolgozni`}>
          A rendszer automatikusan újrapróbálja; kézzel is elindíthatod.{' '}
          <Link
            href={`${base}/events?status=failed`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Megnyitás az eseménynaplóban
          </Link>
        </Callout>
      )}

      <StatGrid>
        <StatCard
          label="Tagok"
          value={overview.memberCount}
          icon={<UsersIcon />}
          tone="primary"
          href={isAdmin ? `${base}/members` : undefined}
        />
        {isAdmin && (
          <StatCard
            label="Aktív munkavállalók"
            value={overview.activeEmployeeCount}
            hint={`összesen ${overview.employeeCount}`}
            icon={<ContactIcon />}
            href={`${base}/employees`}
          />
        )}
        {isAdmin && (
          <StatCard
            label="Kiosztott helyek"
            value={assigned}
            icon={<ArmchairIcon />}
            tone="success"
            href={`${base}/licenses`}
          />
        )}
        {isAdmin && (
          <StatCard
            label="Várólistán"
            value={waiting}
            icon={<HourglassIcon />}
            tone={waiting > 0 ? 'warning' : 'default'}
            hint={waiting > 0 ? 'több hely kellene' : 'mindenki helyet kapott'}
          />
        )}
      </StatGrid>

      {isAdmin && (
        <Section
          title="Szoftverek és helyek"
          description="Szoftverenként látod, hány hely van, ebből mennyit használnak, és hányan várnak helyre."
          actions={
            overview.pools.length > 0 && (
              <LinkButton href={`${base}/licenses`} variant="ghost">
                Licencek és helyek <ArrowRightIcon data-icon="inline-end" />
              </LinkButton>
            )
          }
        >
          {overview.pools.length === 0 ? (
            <EmptyState
              icon={<ArmchairIcon />}
              title="Még nincs licenc"
              description="Vásárolj vagy aktiválj egy licencet, és add meg, melyik munkakörnek jár."
              action={<LinkButton href="/products">Termékek böngészése</LinkButton>}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {overview.pools.map(pool => (
                <li key={pool.productId}>
                  <Link
                    href={`${base}/licenses/${pool.productId}`}
                    className="flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8 transition-all outline-none hover:shadow-md hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold tracking-tight">{pool.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {pool.earliestExpiry
                            ? `legkorábbi lejárat: ${formatDate(pool.earliestExpiry)}`
                            : 'nem jár le'}
                        </div>
                      </div>
                      {pool.waiting > 0 ? (
                        <StatusBadge tone="warning" dot={false}>
                          {pool.waiting} vár
                        </StatusBadge>
                      ) : pool.ruleCount === 0 ? (
                        <StatusBadge tone="neutral" dot={false}>
                          nincs szabály
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="success" dot={false}>
                          {pool.free} szabad
                        </StatusBadge>
                      )}
                    </div>
                    <CapacityMeter
                      assigned={pool.assigned}
                      capacity={pool.capacity}
                      waiting={pool.waiting}
                      label={pool.productName}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="nums">
                        <span className="font-medium">{pool.assigned}</span>
                        <span className="text-muted-foreground"> / {pool.capacity} hely kiosztva</span>
                      </span>
                      <span className="nums text-muted-foreground">{pool.ruleCount} szabály</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {!isAdmin && (
        <Callout tone="note" title="Mit látsz tagként?">
          A saját hozzáféréseidet a{' '}
          <Link href="/dashboard/software" className="font-medium text-foreground underline underline-offset-4">
            Szoftvereim
          </Link>{' '}
          oldalon találod. A cég kezelését (szabályok, licencek, munkavállalók) a tulajdonos és az adminisztrátorok
          végzik.
        </Callout>
      )}
    </>
  );
}
