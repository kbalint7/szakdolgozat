import { cn } from 'cn';
import { ArrowRightIcon, PackageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { EmptyState } from '@/components/empty-state';
import { FilterBar, FilterReset, FilterSearch } from '@/components/filter-bar';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SkeletonFilterBar, SkeletonInput, SkeletonMeta, SkeletonPage, SkeletonText } from '@/components/page-skeleton';
import { Input } from '@/components/ui/input';
import { getCatalog, getCatalogProduct } from '@/lib/data/catalog';
import { formatDuration, formatHuf, formatSeats } from '@/lib/format';
import { z } from '@/lib/validation/zod';

export const metadata: Metadata = {
  title: 'Termékek',
  description: 'Cégeknek szóló szoftverek és csomagjaik.',
};

const filterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  maxPrice: z.coerce.number().int().positive().optional().catch(undefined),
});

const MAX_PLANS = 4;

const list = 'flex flex-col gap-4';
const grid = 'grid grid-cols-1 gap-4 md:grid-cols-2';
const card = 'flex h-full flex-col rounded-xl bg-card shadow-card ring-1 ring-border';
const plans = '@container mx-6 divide-y divide-border/70 border-t border-border/70 text-sm';
const planRow = 'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5 @md:flex';

async function ProductGrid({ searchParams }: { searchParams: PageProps<'/products'>['searchParams'] }) {
  const filter = filterSchema.parse(await searchParams);
  const all = await getCatalog();
  const query = filter.q?.toLocaleLowerCase('hu');
  const matching = all.filter(
    product =>
      (!query || `${product.name} ${product.summary}`.toLocaleLowerCase('hu').includes(query)) &&
      (!filter.maxPrice || (product.lowestPriceHuf !== null && product.lowestPriceHuf <= filter.maxPrice)),
  );
  const products = await Promise.all(
    matching.map(async product => ({ ...product, plans: (await getCatalogProduct(product.slug))?.plans ?? [] })),
  );

  return (
    <div className={list}>
      <FilterBar>
        <FilterSearch defaultValue={filter.q} placeholder="Keresés név szerint" />
        <Input
          name="maxPrice"
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          defaultValue={filter.maxPrice}
          placeholder="Legmagasabb ár (Ft)"
          aria-label="Legmagasabb ár forintban"
          className="w-full bg-card sm:w-44"
        />
        {(filter.q || filter.maxPrice) && <FilterReset href="/products" />}
      </FilterBar>

      {products.length === 0 ? (
        <EmptyState
          icon={<PackageIcon />}
          title={all.length === 0 ? 'Még nincs elérhető termék' : 'Nincs találat'}
          description={all.length === 0 ? 'Nézz vissza később.' : 'Módosítsd a keresést vagy az árat.'}
        />
      ) : (
        <ul className={grid}>
          {products.map(product => (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className={cn(
                  'group transition-all outline-none hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring',
                  card,
                )}
              >
                <div className="space-y-1 px-6 pt-6 pb-5">
                  <h2 className="text-lg/7 font-semibold tracking-tight">{product.name}</h2>
                  {product.summary && <p className="text-sm text-pretty text-muted-foreground">{product.summary}</p>}
                </div>
                {product.plans.length === 0 ? (
                  <p className="mx-6 border-t border-border/70 py-2.5 text-sm text-muted-foreground">
                    Jelenleg nem vásárolható
                  </p>
                ) : (
                  <ul className={plans}>
                    {product.plans.slice(0, MAX_PLANS).map(plan => (
                      <li key={plan.id} className={planRow}>
                        <span className="truncate font-medium">{plan.name}</span>
                        <span className="nums font-medium whitespace-nowrap @md:order-last @md:ml-auto">
                          {formatHuf(plan.priceHuf)}
                        </span>
                        <MetaLine
                          className="col-span-2 text-sm leading-5"
                          items={[formatSeats(plan.seatCount), formatDuration(plan.durationDays)]}
                        />
                      </li>
                    ))}
                    {product.plans.length > MAX_PLANS && (
                      <li className="py-2.5 text-muted-foreground">és még {product.plans.length - MAX_PLANS} csomag</li>
                    )}
                  </ul>
                )}
                <div className="mt-auto flex items-center gap-1 px-6 pt-4 pb-5 text-sm font-medium text-primary">
                  Részletek és vásárlás
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const sampleProducts = [
  { name: 'IDE Pro', summary: 'Professzionális fejlesztőkörnyezet csapatoknak.', plans: 3 },
  {
    name: 'Office Suite',
    summary: 'Irodai programcsomag szövegszerkesztővel, táblázatkezelővel és bemutatókészítővel.',
    plans: 2,
  },
];

function ProductGridSkeleton() {
  return (
    <SkeletonPage>
      <div className={list}>
        <SkeletonFilterBar>
          <SkeletonInput className="sm:w-44" />
        </SkeletonFilterBar>
        <ul className={grid}>
          {sampleProducts.map(product => (
            <li key={product.name} className={card}>
              <div className="space-y-1 px-6 pt-6 pb-5">
                <div className="text-lg/7 font-semibold tracking-tight">
                  <SkeletonText>{product.name}</SkeletonText>
                </div>
                <p className="text-sm text-pretty">
                  <SkeletonText>{product.summary}</SkeletonText>
                </p>
              </div>
              <ul className={plans}>
                {Array.from({ length: product.plans }, (_, i) => (
                  <li key={i} className={planRow}>
                    <span className="truncate font-medium">
                      <SkeletonText>Csapat</SkeletonText>
                    </span>
                    <span className="font-medium whitespace-nowrap @md:order-last @md:ml-auto">
                      <SkeletonText>150 000 Ft</SkeletonText>
                    </span>
                    <SkeletonMeta className="col-span-2 text-sm leading-5" items={['10 hely', '1 év']} />
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-1 px-6 pt-4 pb-5 text-sm font-medium">
                <SkeletonText>Részletek és vásárlás</SkeletonText>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}

export default function ProductsPage({ searchParams }: PageProps<'/products'>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-10 sm:py-12">
      <PageHeader title="Termékek" description="Szoftverek, amelyekből helyeket vásárolhatsz a cégednek." />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
