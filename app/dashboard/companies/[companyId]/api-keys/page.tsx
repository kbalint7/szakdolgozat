import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { RowAction } from '@/components/forms/row-action';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SplitLayout } from '@/components/split-layout';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, EmptyRow, TableCard, TwoLine } from '@/components/table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDate, formatDateTime } from '@/lib/format';
import { listApiKeys } from '@/lib/services/api-keys';

import { revokeApiKeyAction } from './actions';
import { CreateApiKeyForm } from './create-api-key-form';
import { scopeLabel } from './scopes';

export const metadata: Metadata = { title: 'API-kulcsok' };

export default async function ApiKeysPage({ params }: PageProps<'/dashboard/companies/[companyId]/api-keys'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('apiKeys.manage')) return <AccessDenied />;
  const keys = await listApiKeys(companyId);

  return (
    <>
      <PageHeader
        trail={[{ href: `/dashboard/companies/${companyId}`, label: ctx.company.name }]}
        trailMobileOnly
        title="API-kulcsok"
        description="Ezekkel a kulcsokkal jelzi a HR-rendszer, ha valaki belép, munkakört vált vagy kilép."
      />

      <TableCard>
        {keys.length === 0 ? (
          <EmptyRow>Még nincs API-kulcs.</EmptyRow>
        ) : (
          <Table>
            <TableHeader className="max-lg:hidden">
              <TableRow>
                <TableHead className="w-full lg:w-60">Kulcs</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-64">Jogosultságok</TableHead>
                <TableHead className="hidden min-[1400px]:table-cell min-[1400px]:w-36">Létrehozva</TableHead>
                <TableHead className="hidden lg:table-cell lg:w-44">Utoljára használva</TableHead>
                <TableHead className="max-lg:hidden lg:w-32">Állapot</TableHead>
                <ActionHead label="Műveletek" className="max-lg:hidden" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(key => {
                const prefix = <span className="font-mono text-xs">lm_live_{key.prefix}_…</span>;
                const revoke = (className?: string) =>
                  !key.revokedAt && (
                    <RowAction
                      destructive
                      className={className}
                      action={revokeApiKeyAction.bind(null, companyId, key.id)}
                      confirm={{
                        title: 'Visszavonod az API-kulcsot?',
                        description: `A kulccsal küldött kéréseket azonnal elutasítjuk. Ezt nem lehet visszacsinálni. Kulcs: ${key.name}`,
                        confirmLabel: 'Visszavonás',
                        destructive: true,
                      }}
                    >
                      Visszavonás
                    </RowAction>
                  );
                return (
                  <TableRow key={key.id} className="relative">
                    <TableCell className="max-lg:whitespace-normal md:max-lg:w-full">
                      <TwoLine
                        title={<span className="block truncate max-lg:pr-28">{key.name}</span>}
                        sub={
                          <>
                            <span className="max-lg:hidden">{prefix}</span>
                            <MetaLine
                              className="lg:hidden"
                              items={[
                                prefix,
                                key.lastUsedAt
                                  ? `utoljára használva: ${formatDateTime(key.lastUsedAt)}`
                                  : 'még nem használták',
                              ]}
                            />
                          </>
                        }
                      />
                      {revoke('mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {key.scopes.map(scope => (
                        <div key={scope} title={scope} className="truncate leading-5">
                          {scopeLabel(scope)}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="hidden min-[1400px]:table-cell">
                      {key.createdBy ? (
                        <TwoLine
                          title={formatDate(key.createdAt)}
                          sub={<span className="block truncate">{key.createdBy}</span>}
                          className="nums [&>div:first-child]:font-normal"
                        />
                      ) : (
                        <span className="nums">{formatDate(key.createdAt)}</span>
                      )}
                    </TableCell>
                    <TableCell className="nums hidden text-muted-foreground lg:table-cell">
                      {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Még nem használták'}
                    </TableCell>
                    <TableCell className="max-lg:absolute max-lg:top-2.5 max-lg:right-5 max-lg:h-auto max-lg:p-0">
                      {key.revokedAt ? (
                        <StatusBadge tone="neutral" title={formatDateTime(key.revokedAt)}>
                          Visszavonva
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="success">Aktív</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="text-right max-lg:hidden">{revoke()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <SplitLayout
        aside={
          <Callout title="A HR-rendszer beállításához">
            Az eseményeket erre a címre küldd, a kulcsot pedig a fejlécben add meg:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-xs/relaxed text-foreground/85">
              {'POST /api/v1/hr/events\nAuthorization: Bearer <kulcs>'}
            </pre>
          </Callout>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Új kulcs</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateApiKeyForm companyId={companyId} />
          </CardContent>
        </Card>
      </SplitLayout>
    </>
  );
}
