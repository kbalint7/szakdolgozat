import type { Metadata } from 'next';

import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { PageHeader } from '@/components/page-header';
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
        back={{ href: '/admin/products', label: 'Termékek' }}
        eyebrow="Platform admin"
        title="Új termék"
        description="A termék rejtve jön létre. A csomagokat a létrehozás után adhatod hozzá, és a Publikálás gombbal teheted elérhetővé a katalógusban."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent>
            <ProductForm action={createProductAction} submitLabel="Létrehozás" />
          </CardContent>
        </Card>
        <Callout tone="note" title="Azonosító" className="h-fit">
          Az azonosítót a szoftver használja az ellenőrzéskor (pl. <Mono>ide-pro</Mono>). Kisbetű, szám és kötőjel
          használható.
        </Callout>
      </div>
    </>
  );
}
