import { KeySquareIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { Callout } from '@/components/callout';

import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { listClientTokens } from '@/lib/services/client-tokens';

import { revokeTokenAction } from './actions';
import { CreateTokenForm } from './create-token-form';

export const metadata: Metadata = { title: 'Kliens tokenek' };

export default async function TokensPage() {
  const user = await requireUser();
  const tokens = await listClientTokens(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Személyes"
        title="Kliens tokenek"
        description="A tokennel azonosítod magad a szoftverben: ezzel ellenőrzi, hogy használhatod-e."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Új token</CardTitle>
            <CardDescription>A tokent csak egyszer mutatjuk meg, ezért mentsd el biztonságos helyre.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTokenForm />
          </CardContent>
        </Card>
        <Callout tone="note" title="Hol add meg?" className="h-fit">
          A tokent a szoftver beállításaiban add meg. Ha kikerül a kezedből, vond vissza, és hozz létre újat.
        </Callout>
      </div>

      {tokens.length === 0 ? (
        <EmptyState
          compact
          icon={<KeySquareIcon />}
          title="Még nincs tokened"
          description="Hozz létre egyet, és add meg a szoftver beállításaiban."
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Előtag</TableHead>
                <TableHead>Létrehozva</TableHead>
                <TableHead>Utoljára használva</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map(token => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">lm_ct_{token.prefix}_…</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(token.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(token.lastUsedAt)}</TableCell>
                  <TableCell>
                    {token.revokedAt ? (
                      <StatusBadge tone="danger">Visszavonva</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Aktív</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!token.revokedAt && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={revokeTokenAction.bind(null, token.id)}
                        confirm={{
                          title: 'Visszavonod a tokent?',
                          description: `A(z) „${token.name}” tokennel a következő ellenőrzés 401-gyel elutasításra kerül.`,
                          confirmLabel: 'Visszavonás',
                          destructive: true,
                        }}
                      >
                        Visszavonás
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
