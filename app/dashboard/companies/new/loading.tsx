import { SkeletonField, SkeletonForm, SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';
import { Card, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Új cég"
        description="Te leszel a tulajdonos. Adminisztrátorokat és tagokat a létrehozás után hívhatsz meg."
      />
      <Narrow>
        <Card>
          <CardContent>
            <SkeletonForm submit="Létrehozás">
              <SkeletonField label="Cégnév" description="A meghívókban is ez a név jelenik meg." />
              <SkeletonField label="Leírás (nem kötelező)" kind="textarea" />
            </SkeletonForm>
          </CardContent>
        </Card>
      </Narrow>
    </SkeletonPage>
  );
}
