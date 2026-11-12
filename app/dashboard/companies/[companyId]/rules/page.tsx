import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { RowAction } from '@/components/forms/row-action';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SplitLayout } from '@/components/split-layout';
import { ActionHead, EmptyRow, TableCard } from '@/components/table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDate, formatNumber } from '@/lib/format';
import { getCompanyPools } from '@/lib/services/pool-queries';
import { listKnownJobRoles, listRuleProducts, listRulesWithImpact } from '@/lib/services/rules';

import { deleteRuleAction } from './actions';
import { RuleForm } from './rule-form';

export const metadata: Metadata = { title: 'Szabályok' };

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
  const base = `/dashboard/companies/${companyId}`;
  const capacityByProduct = new Map(pools.map(pool => [pool.productId, pool.capacity]));

  return (
    <>
      <PageHeader
        trail={[{ href: base, label: ctx.company.name }]}
        trailMobileOnly
        title="Szabályok"
        description="Itt adod meg, melyik munkakörnek melyik szoftver jár. Aki abban a munkakörben dolgozik, magától helyet kap."
      />

      {rules.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader className="max-xl:hidden">
              <TableRow>
                <TableHead className="w-full md:w-80 xl:w-64">Munkakör</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-40">Szoftver</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-36">Létrehozva</TableHead>
                <TableHead className="hidden text-right xl:table-cell xl:w-24">Jogosultak</TableHead>
                <TableHead className="hidden text-right xl:table-cell xl:w-28">Helyet kapott</TableHead>
                <TableHead className="hidden text-right xl:table-cell xl:w-24">Várólistán</TableHead>
                <ActionHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => {
                const remove = (className?: string) => (
                  <RowAction
                    destructive
                    className={className}
                    aria-label={`Szabály törlése: ${rule.jobRole} → ${rule.product.name}`}
                    action={deleteRuleAction.bind(null, companyId, rule.id)}
                    confirm={{
                      title: 'Törlöd a szabályt?',
                      description: (
                        <>
                          <strong>{rule.product.name}</strong> ezután nem jár annak, akinek a munkaköre{' '}
                          <strong>{rule.jobRole}</strong>.
                          {rule.assigned + rule.waiting === 0 &&
                            'Most senkinek sincs helye a szabály alapján, és senki sem vár.'}
                          {rule.assigned > 0 && <strong>{formatNumber(rule.assigned)} helyet visszaveszünk</strong>}
                          {rule.assigned > 0 && rule.waiting > 0 && <>, és </>}
                          {rule.waiting > 0 && (
                            <strong>{formatNumber(rule.waiting)} ember lekerül a várólistáról</strong>
                          )}
                          {rule.assigned + rule.waiting > 0 && '.'}
                          {rule.assigned > 0 &&
                            ' A felszabaduló helyeket azok kapják, akik más szabály alapján várnak rájuk.'}
                        </>
                      ),
                      confirmLabel: 'Szabály törlése',
                      destructive: true,
                    }}
                  >
                    Törlés
                  </RowAction>
                );
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="w-full max-md:whitespace-normal md:w-80 xl:w-64">
                      <span className="block md:truncate">
                        <span className="font-medium">{rule.jobRole}</span>
                        <span className="xl:hidden">
                          <span className="text-muted-foreground"> → </span>
                          {rule.product.name}
                        </span>
                      </span>
                      <MetaLine
                        className="leading-4 xl:hidden"
                        items={[
                          `${formatNumber(rule.eligible)} embernek jár`,
                          `${formatNumber(rule.assigned)} kapott helyet`,
                          rule.waiting > 0 && <span className="text-warning">{formatNumber(rule.waiting)} vár</span>,
                        ]}
                      />
                      {remove('mt-1.5 mr-0 mb-0 -ml-2.5 md:hidden')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Link
                        href={`${base}/licenses/${rule.product.id}`}
                        className="block truncate hover:underline"
                        title={rule.product.name}
                      >
                        {rule.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                      {formatDate(rule.createdAt)}
                    </TableCell>
                    <TableCell className="nums hidden text-right xl:table-cell">
                      {formatNumber(rule.eligible)}
                    </TableCell>
                    <TableCell className="nums hidden text-right xl:table-cell">
                      {formatNumber(rule.assigned)}
                    </TableCell>
                    <TableCell className="nums hidden text-right xl:table-cell">
                      {rule.waiting > 0 ? (
                        <span className="font-medium text-warning">{formatNumber(rule.waiting)}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right max-md:hidden">{remove()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <SplitLayout
        aside={
          <Callout title="Ki kap helyet?">
            Minden aktív munkavállaló, akinek a munkaköréhez van szabály. Ha nincs elég hely, az kap előbb, aki régebb
            óta vár. Ha törölsz egy szabályt, a vele kiosztott helyeket azonnal visszavesszük.
          </Callout>
        }
      >
        {rules.length === 0 && (
          <TableCard>
            <EmptyRow>Még nincs szabály. Szabály nélkül senki sem kap helyet, akkor sem, ha van licenc.</EmptyRow>
          </TableCard>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Új szabály</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Még nincs szoftver, amelyhez szabályt adhatnál.</p>
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
      </SplitLayout>
    </>
  );
}
