import { cn } from 'cn';
import { ReceiptIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { Stat, StatStrip } from '@/components/stat-card';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatHuf, formatNumber, formatSeats } from '@/lib/format';
import { getSalesStatistics } from '@/lib/services/sales';

export const metadata: Metadata = { title: 'Statisztika' };

function Count({ value, className }: { value: number; className?: string }) {
  return (
    <TableCell className={cn('nums text-right', value === 0 && 'text-muted-foreground', className)}>
      {formatNumber(value)}
    </TableCell>
  );
}

export default async function SalesStatsPage() {
  await requirePlatformAdmin();
  const { rows, totals } = await getSalesStatistics();

  return (
    <>
      <PageHeader
        title="Statisztika"
        description="Vásárlások és kézzel kiadott kulcsok, a rendeléskor érvényes árakon."
      />
      <StatStrip>
        <Stat label="Rendelések" value={formatNumber(totals.orders)} />
        {totals.ordersLast30 !== totals.orders && (
          <Stat label="Rendelések (30 nap)" value={formatNumber(totals.ordersLast30)} />
        )}
        <Stat label="Bevétel" value={formatHuf(totals.revenueHuf)} />
        {totals.ordersLast30 !== totals.orders && (
          <Stat label="Bevétel (30 nap)" value={formatHuf(totals.revenueLast30Huf)} />
        )}
        <Stat label="Érvényes helyek" value={formatNumber(totals.activeSeats)} />
      </StatStrip>
      <Section title="Termékenként">
        {rows.length === 0 ? (
          <EmptyState
            compact
            icon={<ReceiptIcon />}
            title="Még nem volt eladás"
            description="Az első vásárlás vagy kézzel kiadott kulcs után itt látod az eladásokat termékenként."
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full md:w-auto">Termék</TableHead>
                  <TableHead className="hidden text-right lg:table-cell lg:w-26">Rendelések</TableHead>
                  <TableHead
                    className="hidden text-right min-[87.5rem]:table-cell min-[87.5rem]:w-28"
                    title="A rendelések közül a kézzel kiadott kulcsok"
                  >
                    Kézzel kiadott
                  </TableHead>
                  <TableHead className="hidden text-right xl:table-cell xl:w-32">Eladott helyek</TableHead>
                  <TableHead className="hidden text-right xl:table-cell xl:w-36">Érvényes licencek</TableHead>
                  <TableHead
                    className="hidden text-right min-[87.5rem]:table-cell min-[87.5rem]:w-18"
                    title="Cégek, amelyeknek érvényes licencük van"
                  >
                    Cégek
                  </TableHead>
                  <TableHead className="text-right md:w-32">Bevétel</TableHead>
                  <TableHead className="max-lg:text-right max-md:pl-0 md:w-28 lg:w-50">Részesedés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const share = totals.revenueHuf > 0 ? Math.round((row.revenueHuf / totals.revenueHuf) * 100) : 0;
                  return (
                    <TableRow key={row.productId}>
                      <TableCell className="max-lg:whitespace-normal">
                        <div className="truncate leading-5 font-medium">{row.productName}</div>
                        <MetaLine
                          className="lg:hidden"
                          items={[`${formatNumber(row.orders)} rendelés`, formatSeats(row.seatsSold)]}
                        />
                      </TableCell>
                      <Count value={row.orders} className="hidden lg:table-cell" />
                      <Count value={row.manualOrders} className="hidden min-[87.5rem]:table-cell" />
                      <Count value={row.seatsSold} className="hidden xl:table-cell" />
                      <Count value={row.activeLicenses} className="hidden xl:table-cell" />
                      <Count value={row.activeCompanies} className="hidden min-[87.5rem]:table-cell" />
                      <TableCell className="nums text-right">{formatHuf(row.revenueHuf)}</TableCell>
                      <TableCell className="max-md:pl-0">
                        <div className="flex items-center justify-end gap-2.5">
                          <div
                            aria-hidden
                            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted max-lg:hidden"
                          >
                            <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                          </div>
                          <span className="nums w-9 text-right text-[13px] text-muted-foreground">{share}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>
    </>
  );
}
