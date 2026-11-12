import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Callout } from '@/components/callout';
import { ActionButton } from '@/components/forms/action-button';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { SplitLayout } from '@/components/split-layout';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, EmptyRow, TableCard } from '@/components/table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDuration, formatHuf, formatNumber, formatSeats } from '@/lib/format';
import { getProductForAdmin } from '@/lib/services/catalog';
import { isUuid } from '@/lib/validation/ids';

import { setProductPublishedAction, updateProductAction } from '../actions';
import { NewPlanButton, PlanRowActions } from '../plan-dialog';
import { ProductForm } from '../product-form';

export const metadata: Metadata = { title: 'Termék szerkesztése' };

export default async function EditProductPage({ params }: PageProps<'/admin/products/[productId]'>) {
  await requirePlatformAdmin();
  const { productId } = await params;
  const product = isUuid(productId) ? await getProductForAdmin(productId) : null;
  if (!product) notFound();

  return (
    <>
      <PageHeader
        trail={[{ href: '/admin/products', label: 'Termékek' }]}
        title={product.name}
        meta={
          <>
            {product.isPublished ? (
              <StatusBadge tone="success">Publikált</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Rejtett</StatusBadge>
            )}
            <ActionButton
              variant="outline"
              size="sm"
              action={setProductPublishedAction.bind(null, product.id, !product.isPublished)}
              confirm={
                product.isPublished
                  ? {
                      title: 'Elrejted a terméket?',
                      description:
                        'A termék eltűnik a katalógusból, és nem lehet megvenni. A már aktivált licencek érvényesek maradnak.',
                      confirmLabel: 'Elrejtés',
                    }
                  : undefined
              }
            >
              {product.isPublished ? 'Elrejtés a katalógusból' : 'Publikálás'}
            </ActionButton>
          </>
        }
      />

      <Section
        title="Csomagok"
        count={product.plans.length}
        actions={<NewPlanButton productId={product.id} />}
        className={product.plans.length === 0 ? 'max-w-[46rem]' : undefined}
      >
        {product.plans.length === 0 ? (
          <TableCard>
            <EmptyRow>Még nincs csomag, ezért a termék nem vásárolható.</EmptyRow>
          </TableCard>
        ) : (
          <TableCard>
            <Table>
              <TableHeader className="max-lg:hidden">
                <TableRow>
                  <TableHead className="w-full lg:w-40 xl:w-60">Csomag</TableHead>
                  <TableHead className="lg:w-40">Időtartam</TableHead>
                  <TableHead className="lg:w-32">Állapot</TableHead>
                  <TableHead className="text-right lg:w-20">Helyek</TableHead>
                  <TableHead className="pr-5 text-right lg:w-32">Ár</TableHead>
                  <ActionHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.plans.map(plan => {
                  const duration = formatDuration(plan.durationDays);
                  const status = plan.isActive ? (
                    <StatusBadge tone="success">Vásárolható</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Inaktív</StatusBadge>
                  );
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="max-lg:whitespace-normal">
                        <div className="flex items-center justify-between gap-3 leading-5">
                          <span className="min-w-0 truncate font-medium">{plan.name}</span>
                          <span className="shrink-0 lg:hidden">{status}</span>
                        </div>
                        <MetaLine
                          className="lg:hidden"
                          items={[formatSeats(plan.seatCount), duration, formatHuf(plan.priceHuf)]}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{duration}</TableCell>
                      <TableCell className="max-lg:hidden">{status}</TableCell>
                      <TableCell className="nums hidden text-right lg:table-cell">
                        {formatNumber(plan.seatCount)}
                      </TableCell>
                      <TableCell className="nums hidden pr-5 text-right lg:table-cell">
                        {formatHuf(plan.priceHuf)}
                      </TableCell>
                      <TableCell className="w-px pl-0 text-right md:w-12 lg:w-auto">
                        <PlanRowActions
                          productId={product.id}
                          plan={{
                            id: plan.id,
                            name: plan.name,
                            seatCount: plan.seatCount,
                            durationDays: plan.durationDays,
                            priceHuf: plan.priceHuf,
                            isActive: plan.isActive,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <SplitLayout
        aside={
          <Callout title="Mire hat a módosítás?">
            Ha módosítasz egy csomagot vagy elrejted a terméket, az csak az új vásárlásokra hat. A már megvett licencek
            ugyanannyi helyet adnak, és ugyanaddig érvényesek.
          </Callout>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Termékadatok</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              action={updateProductAction.bind(null, product.id)}
              defaultValues={{
                name: product.name,
                slug: product.slug,
                summary: product.summary,
                description: product.description,
              }}
              submitLabel="Mentés"
            />
          </CardContent>
        </Card>
      </SplitLayout>
    </>
  );
}
