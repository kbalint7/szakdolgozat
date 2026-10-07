import { ArrowRightIcon, PackageIcon, SearchIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { SkeletonPage, SkeletonSearchBar, SkeletonTileGrid } from '@/components/page-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCatalog } from '@/lib/data/catalog';
import { formatHuf } from '@/lib/format';
import { z } from '@/lib/validation/zod';

export const metadata: Metadata = {
  title: 'Termékek',
  description: 'A vállalatok számára elérhető szoftverek és csomagjaik.',
};

const filterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  maxPrice: z.coerce.number().int().positive().optional().catch(undefined),
});

async function ProductGrid({ searchParams }: { searchParams: PageProps<'/products'>['searchParams'] }) {
  const filter = filterSchema.parse(await searchParams);
  const all = await getCatalog();
  const query = filter.q?.toLocaleLowerCase('hu');
  const products = all.filter(
    product =>
      (!query || `${product.name} ${product.summary}`.toLocaleLowerCase('hu').includes(query)) &&
      (!filter.maxPrice || (product.lowestPriceHuf !== null && product.lowestPriceHuf <= filter.maxPrice)),
  );

  return (
    <>
      <form
        className="flex flex-col gap-2 rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/8 sm:flex-row sm:items-center"
        role="search"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filter.q}
            placeholder="Keresés név szerint"
            aria-label="Keresés"
            className="pl-8"
          />
        </div>
        <Input
          name="maxPrice"
          type="number"
          min={1}
          step={1000}
          defaultValue={filter.maxPrice}
          placeholder="Legfeljebb (Ft)"
          aria-label="Legmagasabb ár forintban"
          className="sm:max-w-40"
        />
        <Button type="submit" variant="secondary">
          Szűrés
        </Button>
        {(filter.q || filter.maxPrice) && (
          <LinkButton href="/products" variant="ghost">
            Szűrés törlése
          </LinkButton>
        )}
      </form>

      {products.length === 0 ? (
        <EmptyState
          icon={<PackageIcon />}
          title={all.length === 0 ? 'Még nincs elérhető termék' : 'Nincs a szűrésnek megfelelő termék'}
          description={all.length === 0 ? 'Nézz vissza később.' : 'Módosítsd a keresést.'}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="group flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8 transition-all outline-none hover:shadow-md hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PackageIcon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{product.slug}</span>
                </div>
                <div className="space-y-1">
                  <h2 className="font-semibold tracking-tight">{product.name}</h2>
                  <p className="text-sm text-pretty text-muted-foreground">{product.summary || 'Nincs leírás.'}</p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
                  {product.lowestPriceHuf === null ? (
                    <span className="text-muted-foreground">Jelenleg nem vásárolható</span>
                  ) : (
                    <span>
                      <span className="text-muted-foreground">már </span>
                      <span className="nums font-semibold">{formatHuf(product.lowestPriceHuf)}</span>
                      <span className="text-muted-foreground">-tól</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium text-primary">
                    Részletek <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProductGridSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonSearchBar select="sm:w-40" />
      <SkeletonTileGrid tile="product" count={2} className="sm:grid-cols-2 lg:grid-cols-3" />
    </SkeletonPage>
  );
}

export default function ProductsPage({ searchParams }: PageProps<'/products'>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="space-y-1.5">
        <div className="text-xs font-medium tracking-wide text-primary uppercase">Katalógus</div>
        <h1 className="text-3xl font-semibold tracking-tight">Termékek</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Válaszd ki a cégednek szükséges szoftvert. A helyeket a munkakörök alapján automatikusan osztjuk ki.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
