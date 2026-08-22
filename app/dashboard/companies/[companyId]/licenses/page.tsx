import { ArmchairIcon, HourglassIcon, LayersIcon, RefreshCwIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { CapacityMeter } from '@/components/capacity-meter';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { LicenseStatusBadge } from '@/components/license-status';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatCard, StatGrid } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDate, formatDateTime, formatHuf, formatNumber } from '@/lib/format';
import { listCompanyLicenses, listCompanyOrders } from '@/lib/services/orders';
import { getCompanyPools } from '@/lib/services/pool-queries';

import { reconcileAction } from './actions';
import { ActivateKeyForm } from './activate-key-form';

export const metadata: Metadata = { title: 'Licencek és helyek' };

const keyStatus = {
  unredeemed: { label: 'Aktiválható', tone: 'info' },
  redeemed: { label: 'Aktiválva', tone: 'success' },
  revoked: { label: 'Visszavonva', tone: 'danger' },
} as const;

export default async function LicensesPage({ params }: PageProps<'/dashboard/companies/[companyId]/licenses'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('licenses.view')) return <AccessDenied />;

  const now = new Date();
  const [pools, companyLicenses, companyOrders] = await Promise.all([
    getCompanyPools(companyId, now),
    listCompanyLicenses(companyId),
    listCompanyOrders(companyId),
  ]);
  const totals = pools.reduce(
    (sum, pool) => ({
      capacity: sum.capacity + pool.capacity,
      assigned: sum.assigned + pool.assigned,
      free: sum.free + pool.free,
      waiting: sum.waiting + pool.waiting,
    }),
    { capacity: 0, assigned: 0, free: 0, waiting: 0 },
  );
  const base = `/dashboard/companies/${companyId}`;

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Licencek és helyek"
        description="Itt látod, mennyi helyed van az egyes szoftverekből, és hogyan használod ki őket."
        actions={
          <>
            <ActionButton variant="outline" action={reconcileAction.bind(null, companyId)}>
              <RefreshCwIcon data-icon="inline-start" /> Újraszámolás
            </ActionButton>
            <LinkButton href="/products">Vásárlás</LinkButton>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Összes hely" value={formatNumber(totals.capacity)} icon={<LayersIcon />} tone="primary" />
        <StatCard label="Kiosztva" value={formatNumber(totals.assigned)} icon={<ArmchairIcon />} tone="success" />
        <StatCard label="Szabad" value={formatNumber(totals.free)} icon={<ArmchairIcon />} />
        <StatCard
          label="Várólistán"
          value={formatNumber(totals.waiting)}
          icon={<HourglassIcon />}
          tone={totals.waiting > 0 ? 'warning' : 'default'}
        />
      </StatGrid>

      <Section
        title="Szoftverek és helyek"
        description="Szoftverenként. A névre kattintva látod a várólistát és a kiosztott helyeket."
      >
        {pools.length === 0 ? (
          <EmptyState
            icon={<ArmchairIcon />}
            title="Még nincs licenc"
            description="Vásárolj vagy aktiválj egy licencet, és add meg, melyik munkakörnek jár."
            action={<LinkButton href="/products">Termékek böngészése</LinkButton>}
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termék</TableHead>
                  <TableHead className="text-right">Összes</TableHead>
                  <TableHead className="text-right">Kiosztva</TableHead>
                  <TableHead className="text-right">Szabad</TableHead>
                  <TableHead className="text-right">Várólista</TableHead>
                  <TableHead className="w-40">Kihasználtság</TableHead>
                  <TableHead>Legkorábbi lejárat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map(pool => (
                  <TableRow key={pool.productId}>
                    <TableCell className="font-medium">
                      <Link href={`${base}/licenses/${pool.productId}`} className="hover:underline">
                        {pool.productName}
                      </Link>
                      {pool.ruleCount === 0 && (
                        <StatusBadge tone="neutral" dot={false} className="ml-2">
                          nincs szabály
                        </StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="nums text-right">{formatNumber(pool.capacity)}</TableCell>
                    <TableCell className="nums text-right">{formatNumber(pool.assigned)}</TableCell>
                    <TableCell className="nums text-right">{formatNumber(pool.free)}</TableCell>
                    <TableCell className="nums text-right">
                      {pool.waiting > 0 ? (
                        <StatusBadge tone="warning" dot={false}>
                          {pool.waiting}
                        </StatusBadge>
                      ) : (
                        0
                      )}
                    </TableCell>
                    <TableCell>
                      <CapacityMeter
                        size="sm"
                        assigned={pool.assigned}
                        capacity={pool.capacity}
                        waiting={pool.waiting}
                        label={pool.productName}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pool.earliestExpiry ? formatDate(pool.earliestExpiry) : '–'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Licenckulcs aktiválása</CardTitle>
            <CardDescription>
              Az aktiválás után a helyek azonnal kioszthatók a várólistán álló munkavállalóknak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivateKeyForm companyId={companyId} />
          </CardContent>
        </Card>
        <Callout tone="note" title="Mi történik, ha lejár egy licenc?" className="h-fit">
          A lejárt licenc helyei megszűnnek. Ha így kevesebb hely marad, mint ahányan használják, a legutóbb helyet
          kapottak kerülnek vissza a várólistára, de a sorrendben megtartják az eredeti helyüket.
        </Callout>
      </div>

      <Section title="Licencek" description="Aktivált licencek a termékkel, a helyek számával és az érvényességgel.">
        {companyLicenses.length === 0 ? (
          <EmptyState compact icon={<LayersIcon />} title="Még nincs aktivált licenc" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termék</TableHead>
                  <TableHead>Csomag</TableHead>
                  <TableHead className="text-right">Helyek</TableHead>
                  <TableHead>Érvényesség</TableHead>
                  <TableHead>Állapot</TableHead>
                  <TableHead>Forrás</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyLicenses.map(license => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.productName}</TableCell>
                    <TableCell>{license.planName}</TableCell>
                    <TableCell className="nums text-right">{formatNumber(license.seatCount)}</TableCell>
                    <TableCell className="nums">
                      {formatDate(license.validFrom)} –{' '}
                      {license.validUntil ? formatDate(license.validUntil) : 'határozatlan'}
                    </TableCell>
                    <TableCell>
                      <LicenseStatusBadge license={license} now={now} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {license.orderSource === 'manual' ? 'Kézi kulcs' : 'Vásárlás'} · <Mono>…{license.keyLast4}</Mono>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <Section title="Rendelések" description="A cég nevében leadott rendelések.">
        {companyOrders.length === 0 ? (
          <EmptyState compact icon={<LayersIcon />} title="Még nem vásároltatok ennek a cégnek a nevében" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Termék és csomag</TableHead>
                  <TableHead className="text-right">Ár</TableHead>
                  <TableHead>Kulcs</TableHead>
                  <TableHead>Vásárolta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="nums text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{order.productName}</span> · {order.planName}
                    </TableCell>
                    <TableCell className="nums text-right">{formatHuf(order.priceHuf)}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-2">
                        <Mono>…{order.keyLast4}</Mono>
                        {order.keyStatus && (
                          <StatusBadge tone={keyStatus[order.keyStatus].tone}>
                            {keyStatus[order.keyStatus].label}
                          </StatusBadge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.placedBy ?? '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>
    </>
  );
}
