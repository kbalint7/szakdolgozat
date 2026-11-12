import { PackageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Ident } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, ChevronCell, TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { listProductsForAdmin } from '@/lib/services/catalog';

export const metadata: Metadata = { title: 'Termékek' };

export default async function AdminProductsPage() {
  await requirePlatformAdmin();
  const products = await listProductsForAdmin();

  return (
    <>
      <PageHeader
        title="Termékek"
        description="A katalógus szoftverei és csomagjaik."
        actions={products.length > 0 && <LinkButton href="/admin/products/new">Új termék</LinkButton>}
      />
      {products.length === 0 ? (
        <EmptyState
          icon={<PackageIcon />}
          title="Még nincs termék"
          description="Hozd létre az első terméket, majd adj hozzá csomagokat."
          action={<LinkButton href="/admin/products/new">Új termék</LinkButton>}
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-full md:w-56 xl:w-64 min-[87.5rem]:w-72">Termék</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-40">Azonosító</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-44">Módosítva</TableHead>
                <TableHead className="md:w-32">Állapot</TableHead>
                <TableHead className="hidden text-right lg:table-cell lg:w-44">Vásárolható csomagok</TableHead>
                <ActionHead label="Megnyitás" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => {
                const inactivePlans = product.planCount - product.activePlanCount;
                return (
                  <TableRow key={product.id} className="relative">
                    <TableCell className="max-lg:whitespace-normal">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="block truncate leading-5 font-medium outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                      >
                        {product.name}
                      </Link>
                      <MetaLine
                        className="lg:hidden"
                        items={[<Ident key="slug">{product.slug}</Ident>, `${product.planCount} csomag`]}
                      />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Ident className="block truncate">{product.slug}</Ident>
                    </TableCell>
                    <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                      {formatDateTime(product.updatedAt)}
                    </TableCell>
                    <TableCell>
                      {product.isPublished ? (
                        <StatusBadge tone="success">Publikált</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Rejtett</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="nums hidden text-right lg:table-cell">
                      {inactivePlans > 0 && (
                        <span className="mr-3 text-[13px] text-muted-foreground">{inactivePlans} inaktív</span>
                      )}
                      {product.activePlanCount > 0 ? (
                        product.activePlanCount
                      ) : (
                        <span
                          className="font-medium text-warning"
                          title="Vásárolható csomag nélkül a terméket nem lehet megvenni."
                        >
                          0
                        </span>
                      )}
                    </TableCell>
                    <ChevronCell />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
