import { BuildingIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SplitLayout } from '@/components/split-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';
import { can } from '@/lib/domain/permissions';
import { formatDuration, formatHuf, formatSeats } from '@/lib/format';
import { listMyCompanies } from '@/lib/services/companies';
import { getPurchasablePlan } from '@/lib/services/orders';
import { isUuid } from '@/lib/validation/ids';

import { PurchaseForm } from './purchase-form';

export const metadata: Metadata = { title: 'Vásárlás' };

export default async function PurchasePage({ params }: PageProps<'/dashboard/purchase/[planId]'>) {
  const user = await requireUser();
  const { planId } = await params;
  const plan = isUuid(planId) ? await getPurchasablePlan(planId) : null;
  if (!plan) notFound();

  const companies = (await listMyCompanies(user.id)).filter(company => can(company.role, 'licenses.purchase'));

  return (
    <>
      <PageHeader
        trail={[{ href: `/products/${plan.product.slug}`, label: plan.product.name }]}
        title="Vásárlás"
        description="Válaszd ki, melyik cég nevére szóljon a licenc."
      />
      <SplitLayout
        className="max-xl:[&>aside]:order-first xl:[&>aside]:pt-0"
        aside={
          <Card>
            <CardHeader>
              <CardTitle>{plan.product.name}</CardTitle>
              <CardDescription>
                <MetaLine
                  className="text-sm leading-5"
                  items={[`${plan.name} csomag`, formatSeats(plan.seatCount), formatDuration(plan.durationDays)]}
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border/70 pt-4">
                <span className="whitespace-nowrap text-muted-foreground">Egyszeri díj</span>
                <span className="nums text-2xl font-semibold tracking-tight whitespace-nowrap">
                  {formatHuf(plan.priceHuf)}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-pretty text-muted-foreground">
                Ez bemutató, fizetned nem kell. A rendelést csak rögzítjük.
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardContent>
            {companies.length === 0 ? (
              <EmptyState
                compact
                icon={<BuildingIcon />}
                title="Nincs olyan céged, amelynek nevében vásárolhatsz"
                description="Vásárolni a cég tulajdonosa vagy adminisztrátora tud. Hozz létre egy céget, vagy kérj adminisztrátori szerepkört."
                action={<LinkButton href="/dashboard/companies/new">Cég létrehozása</LinkButton>}
              />
            ) : (
              <PurchaseForm planId={plan.id} companies={companies.map(({ id, name }) => ({ id, name }))} />
            )}
          </CardContent>
        </Card>
      </SplitLayout>
    </>
  );
}
