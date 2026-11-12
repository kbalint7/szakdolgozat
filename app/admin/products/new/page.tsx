import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Narrow } from '@/components/split-layout';
import { Card, CardContent } from '@/components/ui/card';
import { requirePlatformAdmin } from '@/lib/auth/session';

import { createProductAction } from '../actions';
import { ProductForm } from '../product-form';

export const metadata: Metadata = { title: 'Új termék' };

export default async function NewProductPage() {
  await requirePlatformAdmin();
  return (
    <>
      <PageHeader
        trail={[{ href: '/admin/products', label: 'Termékek' }]}
        title="Új termék"
        description="Az új termék egyelőre rejtett. Adj hozzá csomagokat, utána publikáld."
      />
      <Narrow>
        <Card>
          <CardContent>
            <ProductForm action={createProductAction} submitLabel="Létrehozás" />
          </CardContent>
        </Card>
      </Narrow>
    </>
  );
}
