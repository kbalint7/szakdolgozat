import { ReceiptIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { Ident } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { RowAction } from '@/components/forms/row-action';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, TableCard, TwoLine } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDate, formatDateTime, formatHuf } from '@/lib/format';
import { listAllOrders, listPlansForIssuing } from '@/lib/services/orders';

import { revokeLicenseAction, revokeLicenseKeyAction } from './actions';
import { IssueKeyDialog } from './issue-key-form';

export const metadata: Metadata = { title: 'Rendelések' };

const manualKey = 'Kézzel kiadott kulcs';

type Order = Awaited<ReturnType<typeof listAllOrders>>[number];

function KeyStatus({ order }: { order: Order }) {
  if (order.licenseStatus === 'revoked' || order.keyStatus === 'revoked') {
    return <StatusBadge tone="danger">Visszavonva</StatusBadge>;
  }
  if (order.keyStatus === 'unredeemed') return <StatusBadge tone="info">Aktiválható</StatusBadge>;
  if (order.keyStatus === 'redeemed') {
    return (
      <StatusBadge tone="neutral" dot="hidden">
        Aktiválva
      </StatusBadge>
    );
  }
  return null;
}

function Revoke({ order, className }: { order: Order; className?: string }) {
  if (order.licenseId && order.licenseStatus === 'active') {
    return (
      <RowAction
        destructive
        className={className}
        title="Licenc visszavonása"
        action={revokeLicenseAction.bind(null, order.licenseId)}
        confirm={{
          title: 'Visszavonod a licencet?',
          description:
            'A cég elveszíti a licenc helyeit. Ha így nem jut mindenkinek hely, azok kerülnek vissza a várólistára, akik utoljára kaptak.',
          confirmLabel: 'Visszavonás',
          destructive: true,
        }}
      >
        Visszavonás
      </RowAction>
    );
  }
  if (order.keyId && order.keyStatus === 'unredeemed') {
    return (
      <RowAction
        destructive
        className={className}
        title="Kulcs visszavonása"
        action={revokeLicenseKeyAction.bind(null, order.keyId)}
        confirm={{
          title: 'Visszavonod a kulcsot?',
          description: 'Ezt a kulcsot ezután senki sem tudja aktiválni.',
          confirmLabel: 'Visszavonás',
          destructive: true,
        }}
      >
        Visszavonás
      </RowAction>
    );
  }
  return null;
}

export default async function AdminOrdersPage() {
  await requirePlatformAdmin();
  const [orders, plans] = await Promise.all([listAllOrders(), listPlansForIssuing()]);

  return (
    <>
      <PageHeader
        title="Rendelések"
        description="Minden vásárlás és kézzel kiadott licenckulcs, a legfrissebb elöl."
        actions={
          <IssueKeyDialog
            plans={plans.map(plan => ({
              id: plan.id,
              label: `${plan.productName} · ${plan.name}${plan.isActive ? '' : ' (inaktív)'}`,
            }))}
          />
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon />}
          title="Még nincs rendelés"
          description="Itt jelenik meg minden vásárlás és minden kézzel kiadott kulcs."
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader className="max-lg:hidden">
              <TableRow>
                <TableHead className="w-full lg:w-48 xl:w-52 min-[87.5rem]:w-56">Termék és csomag</TableHead>
                <TableHead className="lg:w-44">Cég</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-44">Megrendelve</TableHead>
                <TableHead className="hidden min-[87.5rem]:table-cell min-[87.5rem]:w-24">Kulcs</TableHead>
                <TableHead className="lg:w-32">Állapot</TableHead>
                <TableHead className="hidden text-right xl:table-cell xl:w-32">Ár</TableHead>
                <ActionHead label="Műveletek" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => {
                const company = order.companyName ?? order.redeemedCompanyName;
                const manual = order.source === 'manual';
                return (
                  <TableRow key={order.id}>
                    <TableCell className="max-lg:whitespace-normal">
                      <TwoLine
                        title={
                          <span className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate">{order.productName}</span>
                            <span className="shrink-0 font-normal lg:hidden">
                              <KeyStatus order={order} />
                            </span>
                          </span>
                        }
                        sub={
                          <>
                            <span className="block truncate max-lg:hidden">{order.planName}</span>
                            <MetaLine
                              className="lg:hidden"
                              items={[
                                order.planName,
                                company ?? manualKey,
                                formatHuf(order.priceHuf),
                                formatDate(order.createdAt),
                              ]}
                            />
                          </>
                        }
                      />
                      <Revoke order={order} className="mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {company && manual ? (
                        <TwoLine
                          title={<span className="block truncate font-normal">{company}</span>}
                          sub={manualKey}
                        />
                      ) : company ? (
                        <span className="block truncate">{company}</span>
                      ) : (
                        <span className="text-muted-foreground">{manualKey}</span>
                      )}
                    </TableCell>
                    <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="hidden min-[87.5rem]:table-cell">
                      {order.keyLast4 && <Ident title="A kulcs utolsó 4 karaktere">…{order.keyLast4}</Ident>}
                    </TableCell>
                    <TableCell className="max-lg:hidden">
                      <KeyStatus order={order} />
                    </TableCell>
                    <TableCell className="nums hidden text-right xl:table-cell">{formatHuf(order.priceHuf)}</TableCell>
                    <TableCell className="text-right max-lg:hidden">
                      <Revoke order={order} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
