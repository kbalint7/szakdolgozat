import {
  SkeletonField,
  SkeletonForm,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonText,
} from '@/components/page-skeleton';
import { SplitLayout } from '@/components/split-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ IDE Pro"
        title="Vásárlás"
        description="Válaszd ki, melyik cég nevére szóljon a licenc."
      />
      <SplitLayout
        className="max-xl:[&>aside]:order-first xl:[&>aside]:pt-0"
        aside={
          <Card>
            <CardHeader>
              <CardTitle>
                <SkeletonText>IDE Pro</SkeletonText>
              </CardTitle>
              <CardDescription>
                <SkeletonMeta className="text-sm leading-5" items={['Csapat csomag', '20 hely', '1 év']} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border/70 pt-4">
                <span className="whitespace-nowrap">
                  <SkeletonText>Egyszeri díj</SkeletonText>
                </span>
                <span className="text-2xl font-semibold tracking-tight whitespace-nowrap">
                  <SkeletonText>900 000 Ft</SkeletonText>
                </span>
              </div>
              <p className="mt-2 text-[13px] text-pretty">
                <SkeletonText>Ez bemutató, fizetned nem kell. A rendelést csak rögzítjük.</SkeletonText>
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardContent>
            <SkeletonForm submit="Vásárlás megerősítése">
              <SkeletonField label="Cég" />
              <SkeletonField
                kind="checkbox"
                label="Azonnali aktiválás ennél a cégnél"
                description="Ha kikapcsolod, csak a licenckulcsot kapod meg. Egyszer mutatjuk meg, és később aktiválhatod."
              />
            </SkeletonForm>
          </CardContent>
        </Card>
      </SplitLayout>
    </SkeletonPage>
  );
}
