import { KeyRoundIcon, ReceiptIcon, WalletIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatCard, StatGrid } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDateTime, formatHuf, formatNumber } from '@/lib/format';
import { listAllOrders, listPlansForIssuing } from '@/lib/services/orders';

import { revokeLicenseAction, revokeLicenseKeyAction } from './actions';
import { IssueKeyForm } from './issue-key-form';

export const metadata: Metadata = { title: 'Rendelések' };

export default async function AdminOrdersPage() {
  await requirePlatformAdmin();
  const [orders, plans] = await Promise.all([listAllOrders(), listPlansForIssuing()]);
  const revenue = orders.reduce((sum, order) => sum + order.priceHuf, 0);
  const unredeemed = orders.filter(order => order.keyStatus === 'unredeemed').length;
  const manual = orders.filter(order => order.source === 'manual').length;

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Rendelések és licenckulcsok"
        description="Minden vásárlás és kézzel kiadott kulcs, a kulcs és a licenc állapotával."
      />

      <StatGrid>
        <StatCard label="Rendelések" value={formatNumber(orders.length)} icon={<ReceiptIcon />} tone="primary" />
        <StatCard label="Bevétel" value={formatHuf(revenue)} icon={<WalletIcon />} />
        <StatCard label="Aktiválható kulcsok" value={formatNumber(unredeemed)} icon={<KeyRoundIcon />} tone="info" />
        <StatCard label="Kézi kulcsok" value={formatNumber(manual)} hint="offline értékesítés" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Licenckulcs kiadása kézzel</CardTitle>
            <CardDescription>
              Offline értékesítéshez: a kulcs a rendelések között „kézi” forrással jelenik meg, és bármelyik cég
              aktiválhatja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IssueKeyForm
              plans={plans.map(plan => ({
                id: plan.id,
                label: `${plan.productName} · ${plan.name}${plan.isActive ? '' : ' (inaktív)'}`,
              }))}
            />
          </CardContent>
        </Card>
        <Callout tone="note" title="Kulcs és licenc" className="h-fit">
          Egy kulcsot egyszer lehet aktiválni; utána már csak az utolsó négy karakterét látod. Aktiváláskor jön létre a
          licenc, amivel a cég helyeket kap. Ha visszavonod a licencet, a helyek azonnal megszűnnek.
        </Callout>
      </div>

      <Section title="Rendelések" description="Időrendben, a legfrissebb elöl.">
        {orders.length === 0 ? (
          <EmptyState icon={<ReceiptIcon />} title="Még nincs rendelés" />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Cég</TableHead>
                  <TableHead>Termék és csomag</TableHead>
                  <TableHead className="text-right">Ár</TableHead>
                  <TableHead>Forrás</TableHead>
                  <TableHead>Kulcs</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="nums text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{order.companyName ?? order.redeemedCompanyName ?? '–'}</TableCell>
                    <TableCell>
                      <span className="font-medium">{order.productName}</span> · {order.planName}
                    </TableCell>
                    <TableCell className="nums text-right">{formatHuf(order.priceHuf)}</TableCell>
                    <TableCell>
                      {order.source === 'manual' ? (
                        <Badge variant="outline">kézi</Badge>
                      ) : (
                        <Badge variant="secondary">vásárlás</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-2">
                        <Mono>…{order.keyLast4}</Mono>
                        {order.licenseStatus === 'revoked' || order.keyStatus === 'revoked' ? (
                          <StatusBadge tone="danger">visszavonva</StatusBadge>
                        ) : order.keyStatus === 'redeemed' ? (
                          <StatusBadge tone="success">aktiválva</StatusBadge>
                        ) : (
                          <StatusBadge tone="info">aktiválható</StatusBadge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.licenseId && order.licenseStatus === 'active' && (
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={revokeLicenseAction.bind(null, order.licenseId)}
                          confirm={{
                            title: 'Visszavonod a licencet?',
                            description:
                              'A cég ennyivel kevesebb helyet kap; a legutóbb helyet kapottak visszakerülnek a várólistára.',
                            confirmLabel: 'Visszavonás',
                            destructive: true,
                          }}
                        >
                          Licenc visszavonása
                        </ActionButton>
                      )}
                      {order.keyId && order.keyStatus === 'unredeemed' && (
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={revokeLicenseKeyAction.bind(null, order.keyId)}
                          confirm={{
                            title: 'Visszavonod a kulcsot?',
                            description: 'A kulcs ezután nem aktiválható.',
                            confirmLabel: 'Visszavonás',
                            destructive: true,
                          }}
                        >
                          Kulcs visszavonása
                        </ActionButton>
                      )}
                    </TableCell>
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
