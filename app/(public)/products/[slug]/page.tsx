import { cn } from 'cn';
import { PackageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import {
  SkeletonButton,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonText,
} from '@/components/page-skeleton';
import { Section } from '@/components/section';
import { getCatalogProduct } from '@/lib/data/catalog';
import { formatDuration, formatHuf, formatNumber } from '@/lib/format';

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const product = await getCatalogProduct(slug);
  return { title: product?.name ?? 'Termék', description: product?.summary };
}

const planGrid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
const planCard = 'flex flex-col rounded-xl bg-card p-6 shadow-card ring-1 ring-border';

function seatPrice(plan: { priceHuf: number; seatCount: number }) {
  return Math.round(plan.priceHuf / plan.seatCount);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="nums font-medium">{children}</dd>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<'/products/[slug]'>['params'] }) {
  const { slug } = await params;
  await connection();
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const bestPlan = product.plans.reduce<(typeof product.plans)[number] | null>(
    (best, plan) => (best === null || seatPrice(plan) < seatPrice(best) ? plan : best),
    null,
  );
  const comparable = product.plans.length > 1;

  return (
    <>
      <PageHeader
        trail={[{ href: '/products', label: 'Termékek' }]}
        title={product.name}
        description={product.summary || undefined}
      />

      {product.description && (
        <p className="-mt-2 max-w-[68ch] text-[15px]/relaxed text-pretty whitespace-pre-line">{product.description}</p>
      )}

      <Section
        title="Csomagok"
        description={
          product.plans.length > 0 &&
          'Egyszer kell fizetni, és a licenckulcsot azonnal megkapod. Vásárolni a cég tulajdonosa vagy adminisztrátora tud.'
        }
      >
        {product.plans.length === 0 ? (
          <EmptyState
            compact
            icon={<PackageIcon />}
            title="Ehhez a termékhez jelenleg nincs vásárolható csomag"
            description="Nézz vissza később."
          />
        ) : (
          <ul className={planGrid}>
            {product.plans.map(plan => {
              const best = plan.id === bestPlan?.id;
              return (
                <li key={plan.id} className={cn(planCard, best && comparable && 'ring-primary/40')}>
                  <div className="flex h-5 items-baseline justify-between gap-3">
                    <h3 className="text-sm font-medium">{plan.name}</h3>
                    {best && comparable && (
                      <span className="text-[13px]/5 text-muted-foreground">Itt a legolcsóbb egy hely</span>
                    )}
                  </div>
                  <div className="nums mt-2 text-3xl font-semibold tracking-tight">{formatHuf(plan.priceHuf)}</div>
                  <dl className="mt-5 divide-y divide-border/70 border-y border-border/70 text-sm">
                    <Fact label="Helyek">{formatNumber(plan.seatCount)}</Fact>
                    <Fact label="Időtartam">{formatDuration(plan.durationDays)}</Fact>
                    <Fact label="Egy hely ára">{formatHuf(seatPrice(plan))}</Fact>
                  </dl>
                  <LinkButton
                    href={`/dashboard/purchase/${plan.id}`}
                    variant={best ? 'default' : 'outline'}
                    className="mt-6 w-full"
                  >
                    Vásárlás
                  </LinkButton>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}

const sampleFacts = [
  ['Helyek', '20'],
  ['Időtartam', '1 év'],
  ['Egy hely ára', '27 000 Ft'],
];

function ProductDetailSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Termékek"
        title="IDE Pro"
        description="Professzionális fejlesztőkörnyezet csapatoknak."
      />
      <p className="-mt-2 max-w-[68ch] text-[15px]/relaxed text-pretty">
        <SkeletonText>Kódszerkesztő, hibakereső és refaktoráló eszközök egy helyen, fejlesztőcsapatoknak.</SkeletonText>
      </p>
      <SkeletonSection
        title="Csomagok"
        description="Egyszer kell fizetni, és a licenckulcsot azonnal megkapod. Vásárolni a cég tulajdonosa vagy adminisztrátora tud."
      >
        <ul className={planGrid}>
          {['Csapat', 'Részleg', 'Vállalat'].map(plan => (
            <li key={plan} className={planCard}>
              <div className="flex h-5 items-baseline justify-between gap-3">
                <div className="text-sm font-medium">
                  <SkeletonText>{plan}</SkeletonText>
                </div>
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                <SkeletonText>540 000 Ft</SkeletonText>
              </div>
              <div className="mt-5 divide-y divide-border/70 border-y border-border/70 text-sm">
                {sampleFacts.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <SkeletonText>{label}</SkeletonText>
                    <span className="font-medium">
                      <SkeletonText>{value}</SkeletonText>
                    </span>
                  </div>
                ))}
              </div>
              <SkeletonButton className="mt-6 w-full">Vásárlás</SkeletonButton>
            </li>
          ))}
        </ul>
      </SkeletonSection>
    </SkeletonPage>
  );
}

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-10 sm:py-12">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
