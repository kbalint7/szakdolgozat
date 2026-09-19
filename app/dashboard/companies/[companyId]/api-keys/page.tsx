import { KeyRoundIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDateTime } from '@/lib/format';
import { listApiKeys } from '@/lib/services/api-keys';

import { revokeApiKeyAction } from './actions';
import { CreateApiKeyForm } from './create-api-key-form';

export const metadata: Metadata = { title: 'API-kulcsok' };

export default async function ApiKeysPage({ params }: PageProps<'/dashboard/companies/[companyId]/api-keys'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('apiKeys.manage')) return <AccessDenied />;
  const keys = await listApiKeys(companyId);

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="API-kulcsok"
        description="Ezekkel a kulcsokkal küldi át a HR-rendszer a munkavállalók változásait. Egy kulcs mindig egy céghez tartozik."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Új kulcs</CardTitle>
            <CardDescription>A kulcsot csak egyszer mutatjuk meg, ezért mentsd el biztonságos helyre.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateApiKeyForm companyId={companyId} />
          </CardContent>
        </Card>
        <Callout tone="note" title="A HR-rendszer beállításához" className="h-fit">
          A kulcsot <Mono>Authorization: Bearer …</Mono> fejlécben kell küldeni a <Mono>POST /api/v1/hr/events</Mono>{' '}
          címre.
        </Callout>
      </div>

      {keys.length === 0 ? (
        <EmptyState
          compact
          icon={<KeyRoundIcon />}
          title="Még nincs API-kulcs"
          description="Hozz létre egyet a HR-rendszer számára."
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Előtag</TableHead>
                <TableHead>Jogosultságok</TableHead>
                <TableHead>Létrehozta</TableHead>
                <TableHead>Létrehozva</TableHead>
                <TableHead>Utoljára használva</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">lm_live_{key.prefix}_…</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map(scope => (
                        <Badge key={scope} variant="outline" className="font-mono">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{key.createdBy ?? '–'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(key.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(key.lastUsedAt)}</TableCell>
                  <TableCell>
                    {key.revokedAt ? (
                      <StatusBadge tone="danger">Visszavonva</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Aktív</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!key.revokedAt && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={revokeApiKeyAction.bind(null, companyId, key.id)}
                        confirm={{
                          title: 'Visszavonod az API-kulcsot?',
                          description: `A(z) „${key.name}” kulccsal küldött következő kérést 401-gyel elutasítjuk. A művelet nem vonható vissza.`,
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
