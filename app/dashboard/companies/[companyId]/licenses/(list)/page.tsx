import { cn } from 'cn';
import { ArmchairIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Ident } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { LicenseStatusBadge } from '@/components/license-status';
import { LinkButton } from '@/components/link-button';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SeatMeter } from '@/components/seat-map';
import { Section } from '@/components/section';
import { SplitLayout } from '@/components/split-layout';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, ChevronCell, TableCard, TwoLine } from '@/components/table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatHuf, formatSeats, formatUntil } from '@/lib/format';
import { listCompanyLicenses, listCompanyOrders } from '@/lib/services/orders';
import { getCompanyPools } from '@/lib/services/pool-queries';

import { reconcileAction } from '../actions';
import { ActivateKeyForm } from '../activate-key-form';

export const metadata: Metadata = { title: 'Licencek és helyek' };

const keyStatus = {
  unredeemed: { label: 'Aktiválható', tone: 'info' },
  redeemed: { label: 'Máshol aktiválva', tone: 'neutral' },
  revoked: { label: 'Visszavonva', tone: 'danger' },
} as const;

const PERPETUAL = 'határozatlan ideig';

const nameColumn = 'w-full md:w-60 lg:w-64 xl:w-72';
const seatNameColumn = 'md:w-96 lg:w-64 xl:w-72';

function Source({ manual, placedBy }: { manual: boolean; placedBy?: string | null }) {
  const source = manual ? 'Kézzel kiadott kulcs' : 'Vásárlás';
  if (!placedBy) return source;
  return (
    <TwoLine
      title={source}
      sub={<span className="block truncate">{placedBy}</span>}
      className="[&>div:first-child]:font-normal"
    />
  );
}

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
  const base = `/dashboard/companies/${companyId}`;
  const ordersById = new Map(companyOrders.map(order => [order.id, order]));
  const licensedOrderIds = new Set(companyLicenses.map(license => license.orderId));
  const otherOrders = companyOrders.filter(order => !licensedOrderIds.has(order.id));

  return (
    <>
      <PageHeader
        trail={[{ href: base, label: ctx.company.name }]}
        trailMobileOnly
        title="Licencek és helyek"
        description="Hány helye van a cégnek az egyes szoftverekből, és ebből mennyi foglalt."
        actions={<LinkButton href="/products">Vásárlás</LinkButton>}
      />

      {pools.length === 0 ? (
        <EmptyState
          icon={<ArmchairIcon />}
          title="Még nincs licenc"
          description="Vásárolj vagy aktiválj egy licencet, és add meg, melyik munkakörnek jár a szoftver."
        />
      ) : (
        <Section
          title="Helyek szoftverenként"
          actions={
            ctx.can('pools.reconcile') && (
              <ActionButton variant="outline" size="sm" action={reconcileAction.bind(null, companyId)}>
                Helyek újraszámolása
              </ActionButton>
            )
          }
        >
          <TableCard>
            <Table className="max-md:table-fixed">
              <TableHeader className="max-lg:hidden">
                <TableRow>
                  <TableHead className={seatNameColumn}>Szoftver</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-[25rem] xl:w-[36rem]">Helyek</TableHead>
                  <ActionHead label="Megnyitás" className="max-md:w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map(pool => (
                  <TableRow key={pool.productId} className="relative">
                    <TableCell className={cn(seatNameColumn, 'whitespace-normal')}>
                      <span className="flex min-w-0 items-baseline gap-2">
                        <Link
                          href={`${base}/licenses/${pool.productId}`}
                          className="min-w-0 truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                        >
                          {pool.productName}
                        </Link>
                        {pool.ruleCount === 0 && (
                          <StatusBadge tone="neutral" dot={false} className="shrink-0 text-[13px]">
                            Nincs szabály
                          </StatusBadge>
                        )}
                      </span>
                      <SeatMeter
                        assigned={pool.assigned}
                        capacity={pool.capacity}
                        waiting={pool.waiting}
                        label={pool.productName}
                        className="mt-1.5 mb-0.5 lg:hidden"
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <SeatMeter
                        assigned={pool.assigned}
                        capacity={pool.capacity}
                        waiting={pool.waiting}
                        label={pool.productName}
                        className="flex-nowrap"
                      />
                    </TableCell>
                    <ChevronCell className="max-md:w-10" />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </Section>
      )}

      {companyLicenses.length + otherOrders.length > 0 && (
        <Section title="Licencek" count={companyLicenses.length + otherOrders.length}>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={nameColumn}>Szoftver és csomag</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-40">Érvényes</TableHead>
                  <TableHead className="xl:w-44">Állapot</TableHead>
                  <TableHead className="hidden min-[1400px]:w-44 xl:table-cell">Forrás</TableHead>
                  <TableHead className="hidden min-[1400px]:table-cell">Kulcs vége</TableHead>
                  <TableHead className="hidden text-right xl:table-cell xl:w-32">Ár</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyLicenses.map(license => {
                  const order = license.orderId ? ordersById.get(license.orderId) : undefined;
                  const until = license.validUntil ? formatUntil(license.validUntil) : PERPETUAL;
                  const seats = formatSeats(license.seatCount);
                  const keyEnd = `…${license.keyLast4}`;
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="max-md:whitespace-normal">
                        <TwoLine
                          title={<span className="block md:truncate">{license.productName}</span>}
                          sub={
                            <>
                              <MetaLine className="max-lg:hidden" items={[license.planName, seats]} />
                              <MetaLine
                                className="lg:hidden"
                                items={[license.planName, seats, until, keyEnd, order && formatHuf(order.priceHuf)]}
                              />
                            </>
                          }
                        />
                      </TableCell>
                      <TableCell className="nums hidden lg:table-cell">{until}</TableCell>
                      <TableCell className="max-md:align-top">
                        <LicenseStatusBadge license={license} now={now} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Source manual={license.orderSource === 'manual'} placedBy={order?.placedBy} />
                      </TableCell>
                      <TableCell className="hidden min-[1400px]:table-cell">
                        <Ident>{keyEnd}</Ident>
                      </TableCell>
                      <TableCell className="nums hidden text-right xl:table-cell">
                        {order ? formatHuf(order.priceHuf) : '–'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {otherOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="max-md:whitespace-normal">
                      <TwoLine
                        title={<span className="block md:truncate">{order.productName}</span>}
                        sub={
                          <>
                            <span className="block truncate max-lg:hidden">{order.planName}</span>
                            <MetaLine
                              className="lg:hidden"
                              items={[
                                order.planName,
                                order.keyLast4 && `…${order.keyLast4}`,
                                formatHuf(order.priceHuf),
                              ]}
                            />
                          </>
                        }
                      />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">–</TableCell>
                    <TableCell className="max-md:align-top">
                      {order.keyStatus ? (
                        <StatusBadge tone={keyStatus[order.keyStatus].tone}>
                          {keyStatus[order.keyStatus].label}
                        </StatusBadge>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Source manual={false} placedBy={order.placedBy} />
                    </TableCell>
                    <TableCell className="hidden min-[1400px]:table-cell">
                      {order.keyLast4 ? (
                        <Ident>…{order.keyLast4}</Ident>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="nums hidden text-right xl:table-cell">{formatHuf(order.priceHuf)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </Section>
      )}

      <SplitLayout
        aside={
          <Callout title="Aktiválás és lejárat">
            Ha aktiválsz egy kulcsot, a helyeit rögtön megkapják azok, akik a legrégebb óta várnak. Ha egy licenc lejár,
            vagy visszavonják, és így nem jut mindenkinek hely, azok veszítik el a helyüket, akik utoljára kaptak. Ők
            visszakerülnek a várólistára, oda, ahol korábban álltak.
          </Callout>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Licenckulcs aktiválása</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivateKeyForm companyId={companyId} />
          </CardContent>
        </Card>
      </SplitLayout>
    </>
  );
}
