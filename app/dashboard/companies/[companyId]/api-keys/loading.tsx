import {
  SkeletonCallout,
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonRowAction,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { SplitLayout } from '@/components/split-layout';
import { TwoLine } from '@/components/table-card';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="API-kulcsok"
        description="Ezekkel a kulcsokkal jelzi a HR-rendszer, ha valaki belép, munkakört vált vagy kilép."
      />
      <SkeletonTable
        rows={1}
        header="max-lg:hidden"
        columns={[
          {
            head: 'w-full lg:w-60',
            label: 'Kulcs',
            cell: 'max-lg:whitespace-normal md:max-lg:w-full',
            content: (
              <>
                <TwoLine
                  title={
                    <span className="block truncate max-lg:pr-28">
                      <SkeletonText>HR-szimulátor</SkeletonText>
                    </span>
                  }
                  sub={
                    <>
                      <span className="font-mono text-xs max-lg:hidden">
                        <SkeletonText>lm_live_ab12cd34_…</SkeletonText>
                      </span>
                      <SkeletonMeta
                        className="lg:hidden"
                        items={['lm_live_ab12cd34_…', 'utoljára használva: 2026. jan. 10. 15:18']}
                      />
                    </>
                  }
                />
                <SkeletonRowAction className="mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden">Visszavonás</SkeletonRowAction>
              </>
            ),
          },
          {
            head: 'hidden xl:table-cell xl:w-64',
            label: 'Jogosultságok',
            cell: 'hidden xl:table-cell',
            content: (
              <>
                <div className="truncate leading-5">
                  <SkeletonText>HR-események beküldése</SkeletonText>
                </div>
                <div className="truncate leading-5">
                  <SkeletonText>Feldolgozási állapot lekérdezése</SkeletonText>
                </div>
              </>
            ),
          },
          {
            head: 'hidden min-[1400px]:table-cell min-[1400px]:w-36',
            label: 'Létrehozva',
            cell: 'hidden min-[1400px]:table-cell',
            content: (
              <TwoLine
                className="[&>div:first-child]:font-normal"
                title={<SkeletonText>2026. jan. 10.</SkeletonText>}
                sub={<SkeletonText>Példa Tulajdonos</SkeletonText>}
              />
            ),
          },
          {
            head: 'hidden lg:table-cell lg:w-44',
            label: 'Utoljára használva',
            cell: 'hidden lg:table-cell',
            content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
          },
          {
            head: 'max-lg:hidden lg:w-32',
            label: 'Állapot',
            cell: 'max-lg:absolute max-lg:top-2.5 max-lg:right-5 max-lg:h-auto max-lg:p-0',
            content: <SkeletonStatus>Aktív</SkeletonStatus>,
          },
          {
            head: 'w-px md:w-auto max-lg:hidden',
            cell: 'text-right max-lg:hidden',
            content: <SkeletonRowAction>Visszavonás</SkeletonRowAction>,
          },
        ]}
      />
      <SplitLayout
        aside={
          <SkeletonCallout
            title="A HR-rendszer beállításához"
            after={<Skeleton className="mt-2 h-[55px] rounded-lg" />}
          >
            Az eseményeket erre a címre küldd, a kulcsot pedig a fejlécben add meg:
          </SkeletonCallout>
        }
      >
        <SkeletonCard title="Új kulcs">
          <SkeletonForm submit="Kulcs létrehozása">
            <SkeletonField label="Név" />
            <FieldSet className="gap-3">
              <FieldLegend variant="label">
                <SkeletonText>Jogosultságok</SkeletonText>
              </FieldLegend>
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <SkeletonField kind="checkbox" label="HR-események beküldése" description="hr:events:write" />
                <SkeletonField kind="checkbox" label="Feldolgozási állapot lekérdezése" description="hr:events:read" />
              </div>
            </FieldSet>
          </SkeletonForm>
        </SkeletonCard>
      </SplitLayout>
    </SkeletonPage>
  );
}
