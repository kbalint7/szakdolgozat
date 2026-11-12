import type { Metadata } from 'next';

import { RowAction } from '@/components/forms/row-action';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { Narrow } from '@/components/split-layout';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, EmptyRow, TableCard, TwoLine } from '@/components/table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { formatDate, formatDateTime } from '@/lib/format';
import { listClientTokens } from '@/lib/services/client-tokens';

import { revokeTokenAction } from './actions';
import { CreateTokenForm } from './create-token-form';

export const metadata: Metadata = { title: 'Klienstokenek' };

export default async function TokensPage() {
  const user = await requireUser();
  const tokens = await listClientTokens(user.id);

  return (
    <>
      <PageHeader
        title="Klienstokenek"
        description="A szoftverek a tokenedről ismernek fel. Hozz létre egyet, és add meg a szoftver beállításaiban."
      />

      <Narrow>
        <TableCard>
          {tokens.length === 0 ? (
            <EmptyRow className="px-5">Még nincs tokened.</EmptyRow>
          ) : (
            <Table>
              <TableHeader className="max-lg:hidden">
                <TableRow>
                  <TableHead className="w-full lg:w-48">Token</TableHead>
                  <TableHead className="hidden xl:table-cell xl:w-31">Létrehozva</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-42">Utoljára használva</TableHead>
                  <TableHead className="lg:w-31">Állapot</TableHead>
                  <ActionHead label="Műveletek" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map(token => {
                  const prefix = <span className="font-mono text-xs">lm_ct_{token.prefix}_…</span>;
                  const revoke = (className?: string) =>
                    !token.revokedAt && (
                      <RowAction
                        destructive
                        className={className}
                        action={revokeTokenAction.bind(null, token.id)}
                        confirm={{
                          title: 'Visszavonod a tokent?',
                          description: `A szoftver ezzel a tokennel többé nem ismer fel. Ezt nem lehet visszacsinálni. Token: ${token.name}`,
                          confirmLabel: 'Visszavonás',
                          destructive: true,
                        }}
                      >
                        Visszavonás
                      </RowAction>
                    );
                  const status = token.revokedAt ? (
                    <StatusBadge tone="neutral" title={formatDateTime(token.revokedAt)}>
                      Visszavonva
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success">Aktív</StatusBadge>
                  );
                  return (
                    <TableRow key={token.id}>
                      <TableCell className="max-lg:whitespace-normal">
                        <TwoLine
                          title={
                            <span className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate">{token.name}</span>
                              <span className="shrink-0 font-normal lg:hidden">{status}</span>
                            </span>
                          }
                          sub={
                            <>
                              <span className="max-lg:hidden">{prefix}</span>
                              <MetaLine
                                className="lg:hidden"
                                items={[
                                  prefix,
                                  token.lastUsedAt
                                    ? `utoljára használva: ${formatDateTime(token.lastUsedAt)}`
                                    : 'még nem használták',
                                ]}
                              />
                            </>
                          }
                        />
                        {revoke('mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden')}
                      </TableCell>
                      <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                        {formatDate(token.createdAt)}
                      </TableCell>
                      <TableCell className="nums hidden text-muted-foreground lg:table-cell">
                        {token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'Még nem használták'}
                      </TableCell>
                      <TableCell className="max-lg:hidden">{status}</TableCell>
                      <TableCell className="text-right max-lg:hidden">{revoke()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableCard>

        <Card>
          <CardHeader>
            <CardTitle>Új token</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTokenForm />
          </CardContent>
        </Card>
      </Narrow>
    </>
  );
}
