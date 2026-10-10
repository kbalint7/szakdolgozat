import { ArmchairIcon, ReceiptIcon, TrendingUpIcon, WalletIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatCard, StatGrid } from '@/components/stat-card';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatHuf, formatNumber } from '@/lib/format';
import { getSalesStatistics } from '@/lib/services/sales';

export const metadata: Metadata = { title: 'Értékesítési statisztika' };

export default async function SalesStatsPage() {
  await requirePlatformAdmin();
  const { rows, totals } = await getSalesStatistics();

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Értékesítési statisztika"
        description="Szimulált vásárlások és kézzel kiadott kulcsok termékenként. Az árak a rendelés idején érvényes árak."
      />
      <StatGrid>
        <StatCard
          label="Rendelések"
          value={formatNumber(totals.orders)}
          hint={`az elmúlt 30 napban: ${totals.ordersLast30}`}
          icon={<ReceiptIcon />}
          tone="primary"
        />
        <StatCard label="Bevétel" value={formatHuf(totals.revenueHuf)} icon={<WalletIcon />} />
        <StatCard
          label="Bevétel (30 nap)"
          value={formatHuf(totals.revenueLast30Huf)}
          icon={<TrendingUpIcon />}
          tone="info"
        />
        <StatCard
          label="Érvényes helyek"
          value={formatNumber(totals.activeSeats)}
          icon={<ArmchairIcon />}
          tone="success"
        />
      </StatGrid>
      <Section title="Termékenként" description="Rendelések, eladott helyek és bevétel termékenként.">
        {rows.length === 0 ? (
          <EmptyState compact icon={<ReceiptIcon />} title="Még nincs értékesítés" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termék</TableHead>
                  <TableHead className="text-right">Rendelés</TableHead>
                  <TableHead className="text-right">ebből kézi</TableHead>
                  <TableHead className="text-right">Eladott helyek</TableHead>
                  <TableHead className="text-right">Bevétel</TableHead>
                  <TableHead className="text-right">Érvényes licencek</TableHead>
                  <TableHead className="text-right">Cégek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.productId}>
                    <TableCell className="font-medium">{row.productName}</TableCell>
                    <TableCell className="nums text-right">{row.orders}</TableCell>
                    <TableCell className="nums text-right text-muted-foreground">{row.manualOrders}</TableCell>
                    <TableCell className="nums text-right">{formatNumber(row.seatsSold)}</TableCell>
                    <TableCell className="nums text-right">{formatHuf(row.revenueHuf)}</TableCell>
                    <TableCell className="nums text-right">{row.activeLicenses}</TableCell>
                    <TableCell className="nums text-right">{row.activeCompanies}</TableCell>
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
