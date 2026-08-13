import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDuration, formatHuf, formatNumber } from '@/lib/format';
import { getProductForAdmin } from '@/lib/services/catalog';
import { isUuid } from '@/lib/validation/ids';

import { setPlanActiveAction, setProductPublishedAction, updateProductAction } from '../actions';
import { NewPlanButton, PlanDialog } from '../plan-dialog';
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
        back={{ href: '/admin/products', label: 'Termékek' }}
        eyebrow="Termék"
        title={product.name}
        description={product.summary || undefined}
        meta={
          <>
            <Mono>{product.slug}</Mono>
            {product.isPublished ? (
              <StatusBadge tone="success">Publikált</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Rejtett</StatusBadge>
            )}
          </>
        }
        actions={
          <ActionButton
            variant={product.isPublished ? 'outline' : 'default'}
            action={setProductPublishedAction.bind(null, product.id, !product.isPublished)}
            confirm={
              product.isPublished
                ? {
                    title: 'Elrejted a terméket?',
                    description:
                      'A termék eltűnik a katalógusból és nem vásárolható. A már aktivált licencek továbbra is érvényesek.',
                    confirmLabel: 'Elrejtés',
                  }
                : undefined
            }
          >
            {product.isPublished ? 'Elrejtés a katalógusból' : 'Publikálás'}
          </ActionButton>
        }
      />

      <Section
        title="Csomagok"
        description="Helyek száma, időtartam és ár. Az inaktív csomag nem vásárolható; a módosítás csak az új vásárlásokra vonatkozik."
        actions={<NewPlanButton productId={product.id} />}
      >
        {product.plans.length === 0 ? (
          <Callout tone="info">Ehhez a termékhez még nincs csomag. Csomag nélkül a termék nem vásárolható.</Callout>
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Név</TableHead>
                  <TableHead className="text-right">Helyek</TableHead>
                  <TableHead>Időtartam</TableHead>
                  <TableHead className="text-right">Ár</TableHead>
                  <TableHead>Állapot</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="nums text-right">{formatNumber(plan.seatCount)}</TableCell>
                    <TableCell>{formatDuration(plan.durationDays)}</TableCell>
                    <TableCell className="nums text-right">{formatHuf(plan.priceHuf)}</TableCell>
                    <TableCell>
                      {plan.isActive ? (
                        <StatusBadge tone="success">Aktív</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Inaktív</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <PlanDialog
                          productId={product.id}
                          plan={{
                            id: plan.id,
                            name: plan.name,
                            seatCount: plan.seatCount,
                            durationDays: plan.durationDays,
                            priceHuf: plan.priceHuf,
                            isActive: plan.isActive,
                          }}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Csomag szerkesztése">
                              <PencilIcon />
                            </Button>
                          }
                        />
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={setPlanActiveAction.bind(null, plan.id, !plan.isActive)}
                        >
                          {plan.isActive ? 'Inaktiválás' : 'Aktiválás'}
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Termékadatok</CardTitle>
          <CardDescription>
            Az azonosítót a cégeknél futó szoftverek használják az ellenőrzéshez, ezért módosítás után azokat is
            frissíteni kell.
          </CardDescription>
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
    </>
  );
}
