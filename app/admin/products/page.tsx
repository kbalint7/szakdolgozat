import { PackageIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
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
        eyebrow="Platform admin"
        title="Termékek és csomagok"
        description="A katalógusban kínált szoftverek és a megvásárolható csomagjaik. A rejtett termék nem vásárolható, a meglévő licencek érvényesek maradnak."
        actions={
          <LinkButton href="/admin/products/new">
            <PlusIcon data-icon="inline-start" /> Új termék
          </LinkButton>
        }
      />
      {products.length === 0 ? (
        <EmptyState
          icon={<PackageIcon />}
          title="Még nincs termék"
          description="Hozd létre az első terméket, majd adj hozzá csomagokat."
          action={<LinkButton href="/admin/products/new">Új termék</LinkButton>}
        />
      ) : (
        <TableCard footer={<span className="nums text-muted-foreground">{products.length} termék</span>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Azonosító</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead className="text-right">Csomagok (aktív / összes)</TableHead>
                <TableHead>Módosítva</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Mono>{product.slug}</Mono>
                  </TableCell>
                  <TableCell>
                    {product.isPublished ? (
                      <StatusBadge tone="success">Publikált</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Rejtett</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="nums text-right">
                    {product.activePlanCount} / {product.planCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(product.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
