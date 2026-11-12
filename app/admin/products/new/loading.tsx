import { SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';
import { Card, CardContent } from '@/components/ui/card';

import { ProductFormSkeleton } from '../product-form-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Termékek"
        title="Új termék"
        description="Az új termék egyelőre rejtett. Adj hozzá csomagokat, utána publikáld."
      />
      <Narrow>
        <Card>
          <CardContent>
            <ProductFormSkeleton submit="Létrehozás" />
          </CardContent>
        </Card>
      </Narrow>
    </SkeletonPage>
  );
}
