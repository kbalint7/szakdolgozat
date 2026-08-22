import { BuildingIcon, PackageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
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
        eyebrow={plan.product.name}
        title="Vásárlás"
        description="Válaszd ki, melyik cég nevére szóljon a licenc."
        back={{ href: `/products/${plan.product.slug}`, label: 'Vissza a termékhez' }}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="order-2 h-fit lg:order-1">
          <CardHeader>
            <CardTitle>Rendelés</CardTitle>
            <CardDescription>A licenckulcsot csak egyszer mutatjuk meg, ezért mentsd el.</CardDescription>
          </CardHeader>
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
              <PurchaseForm
                planId={plan.id}
                priceLabel={formatHuf(plan.priceHuf)}
                companies={companies.map(({ id, name }) => ({ id, name }))}
              />
            )}
          </CardContent>
        </Card>
        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageIcon className="size-4" />
            </div>
            <CardDescription>{plan.product.name}</CardDescription>
            <CardTitle>{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-muted-foreground">Helyek</dt>
              <dd className="nums text-right">{formatSeats(plan.seatCount)}</dd>
              <dt className="text-muted-foreground">Időtartam</dt>
              <dd className="text-right">{formatDuration(plan.durationDays)}</dd>
            </dl>
            <div className="flex items-baseline justify-between border-t pt-3">
              <span className="text-muted-foreground">Egyszeri díj</span>
              <span className="nums text-2xl font-semibold tracking-tight">{formatHuf(plan.priceHuf)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
