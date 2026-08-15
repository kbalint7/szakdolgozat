import { ArrowLeftIcon, CheckIcon, PackageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SkeletonLine, SkeletonPage, SkeletonTileGrid } from '@/components/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { getCatalogProduct } from '@/lib/data/catalog';
import { formatDuration, formatHuf, formatSeats } from '@/lib/format';

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const product = await getCatalogProduct(slug);
  return { title: product?.name ?? 'Termék', description: product?.summary };
}

async function ProductDetail({ params }: { params: PageProps<'/products/[slug]'>['params'] }) {
  const { slug } = await params;
  await connection();
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PackageIcon className="size-6" />
        </span>
        <div className="space-y-2">
          <div className="font-mono text-xs text-muted-foreground">{product.slug}</div>
          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          {product.summary && <p className="text-lg text-pretty text-muted-foreground">{product.summary}</p>}
        </div>
      </div>
      {product.description && (
        <p className="max-w-3xl text-pretty whitespace-pre-line text-muted-foreground">{product.description}</p>
      )}

      <section className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Csomagok</h2>
          <p className="text-sm text-muted-foreground">
            Egyszeri díj. A helyek a cég dolgozói között a szabályok alapján automatikusan oszlanak el.
          </p>
        </div>
        {product.plans.length === 0 ? (
          <p className="text-muted-foreground">Ehhez a termékhez jelenleg nincs vásárolható csomag.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.plans.map(plan => (
              <li
                key={plan.id}
                className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8"
              >
                <div className="space-y-1">
                  <h3 className="font-medium">{plan.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {formatSeats(plan.seatCount)} · {formatDuration(plan.durationDays)}
                  </div>
                </div>
                <div className="nums text-3xl font-semibold tracking-tight">{formatHuf(plan.priceHuf)}</div>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {[
                    `${formatSeats(plan.seatCount)} a cégednek`,
                    plan.durationDays === null ? 'Nem jár le' : `Érvényes ${formatDuration(plan.durationDays)}`,
                    'A licenckulcsot azonnal megkapod',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <SkeletonLine size="xs" w="w-16" />
          <SkeletonLine size="3xl" w="w-48" />
          <SkeletonLine size="lg" w="w-96" />
        </div>
      </div>
      <SkeletonLine size="base" w="w-2xl" />
      <section className="flex flex-col gap-4">
        <div className="space-y-1">
          <SkeletonLine size="xl" w="w-28" />
          <SkeletonLine size="sm" w="w-2xl" />
        </div>
        <SkeletonTileGrid tile="plan" count={3} className="sm:grid-cols-2 lg:grid-cols-3" />
      </section>
    </SkeletonPage>
  );
}

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <Link
        href="/products"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Vissza a termékekhez
      </Link>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
