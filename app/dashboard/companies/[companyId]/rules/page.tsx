import { ListChecksIcon, Trash2Icon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDate } from '@/lib/format';
import { getCompanyPools } from '@/lib/services/pool-queries';
import { listKnownJobRoles, listRuleProducts, listRulesWithImpact } from '@/lib/services/rules';

import { deleteRuleAction } from './actions';
import { RuleForm } from './rule-form';

export const metadata: Metadata = { title: 'Jogosultsági szabályok' };

export default async function RulesPage({ params }: PageProps<'/dashboard/companies/[companyId]/rules'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('rules.manage')) return <AccessDenied />;

  const [rules, products, jobRoles, pools] = await Promise.all([
    listRulesWithImpact(companyId),
    listRuleProducts(companyId),
    listKnownJobRoles(companyId),
    getCompanyPools(companyId),
  ]);
  const capacityByProduct = new Map(pools.map(pool => [pool.productId, pool.capacity]));

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Jogosultsági szabályok"
        description="Add meg, melyik munkakörnek melyik szoftver jár. Aki ilyen munkakörben dolgozik, automatikusan helyet kap, vagy várólistára kerül, ha elfogytak a helyek."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Új szabály</CardTitle>
            <CardDescription>
              A szabály azonnal érvényes: a jogosultak helyet kapnak vagy várólistára kerülnek.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Még nincs elérhető termék.</p>
            ) : (
              <RuleForm
                companyId={companyId}
                products={products.map(product => ({
                  ...product,
                  hasCapacity: (capacityByProduct.get(product.id) ?? 0) > 0,
                }))}
                jobRoles={jobRoles}
              />
            )}
          </CardContent>
        </Card>
        <Callout tone="note" title="Hogyan dől el, ki kap helyet?" className="h-fit">
          Helyet az kap, aki aktív munkavállaló, és a munkaköréhez tartozik szabály. Ha kevesebb a hely, mint a
          jogosult, érkezési sorrendben kerülnek sorra. Ha törölsz egy szabályt, az általa adott helyeket azonnal
          visszavesszük.
        </Callout>
      </div>

      <Section title="Szabályok" description={`${rules.length} szabály`}>
        {rules.length === 0 ? (
          <EmptyState
            icon={<ListChecksIcon />}
            title="Még nincs szabály"
            description="Szabály nélkül senki sem kap helyet, akkor sem, ha van licenc."
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Munkakör</TableHead>
                  <TableHead>Termék</TableHead>
                  <TableHead className="text-right">Jogosultak</TableHead>
                  <TableHead className="text-right">Helyet kapott</TableHead>
                  <TableHead className="text-right">Várólistán</TableHead>
                  <TableHead>Létrehozva</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Mono>{rule.jobRole}</Mono>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/companies/${companyId}/licenses/${rule.product.id}`}
                        className="hover:underline"
                      >
                        {rule.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="nums text-right">{rule.eligible}</TableCell>
                    <TableCell className="nums text-right">{rule.assigned}</TableCell>
                    <TableCell className="nums text-right">
                      {rule.waiting > 0 ? (
                        <StatusBadge tone="warning" dot={false}>
                          {rule.waiting}
                        </StatusBadge>
                      ) : (
                        rule.waiting
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(rule.createdAt)}</TableCell>
                    <TableCell>
                      <ActionButton
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Szabály törlése: ${rule.jobRole} → ${rule.product.name}`}
                        action={deleteRuleAction.bind(null, companyId, rule.id)}
                        confirm={{
                          title: 'Törlöd a szabályt?',
                          description: (
                            <>
                              A(z) <strong>{rule.jobRole}</strong> munkakörűek elveszítik a jogosultságot a(z){' '}
                              <strong>{rule.product.name}</strong> termékre:{' '}
                              <strong>{rule.assigned} kiosztott hely visszavonásra kerül</strong>, és{' '}
                              <strong>{rule.waiting} várólista-bejegyzés törlődik</strong>. A felszabaduló helyeket a
                              többi várakozó kapja meg.
                            </>
                          ),
                          confirmLabel: 'Szabály törlése',
                          destructive: true,
                        }}
                      >
                        <Trash2Icon />
                      </ActionButton>
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
