import {
  SkeletonCallout,
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonRowAction,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { SplitLayout } from '@/components/split-layout';

const number = { head: 'hidden text-right xl:table-cell', cell: 'hidden text-right xl:table-cell' };

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Szabályok"
        description="Itt adod meg, melyik munkakörnek melyik szoftver jár. Aki abban a munkakörben dolgozik, magától helyet kap."
      />
      <SkeletonTable
        rows={1}
        header="max-xl:hidden"
        columns={[
          {
            head: 'w-full md:w-80 xl:w-64',
            label: 'Munkakör',
            cell: 'w-full max-md:whitespace-normal md:w-80 xl:w-64',
            content: (
              <>
                <span className="block md:truncate">
                  <span className="font-medium">
                    <SkeletonText>developer</SkeletonText>
                  </span>
                  <span className="xl:hidden">
                    <SkeletonText> → IDE Pro</SkeletonText>
                  </span>
                </span>
                <SkeletonMeta
                  className="leading-4 xl:hidden"
                  items={['22 embernek jár', '20 kapott helyet', '2 vár']}
                />
                <SkeletonRowAction className="mt-1.5 mr-0 mb-0 -ml-2.5 md:hidden">Törlés</SkeletonRowAction>
              </>
            ),
          },
          {
            head: 'hidden xl:table-cell xl:w-40',
            label: 'Szoftver',
            cell: 'hidden xl:table-cell',
            content: <SkeletonText>IDE Pro</SkeletonText>,
          },
          {
            head: 'hidden xl:table-cell xl:w-36',
            label: 'Létrehozva',
            cell: 'hidden xl:table-cell',
            content: <SkeletonText>2026. jan. 10.</SkeletonText>,
          },
          { ...number, head: `${number.head} xl:w-24`, label: 'Jogosultak', content: <SkeletonText>22</SkeletonText> },
          {
            ...number,
            head: `${number.head} xl:w-28`,
            label: 'Helyet kapott',
            content: <SkeletonText>20</SkeletonText>,
          },
          { ...number, head: `${number.head} xl:w-24`, label: 'Várólistán', content: <SkeletonText>2</SkeletonText> },
          {
            head: 'w-px md:w-auto',
            cell: 'text-right max-md:hidden',
            content: <SkeletonRowAction>Törlés</SkeletonRowAction>,
          },
        ]}
      />
      <SplitLayout
        aside={
          <SkeletonCallout title="Ki kap helyet?">
            Minden aktív munkavállaló, akinek a munkaköréhez van szabály. Ha nincs elég hely, az kap előbb, aki régebb
            óta vár. Ha törölsz egy szabályt, a vele kiosztott helyeket azonnal visszavesszük.
          </SkeletonCallout>
        }
      >
        <SkeletonCard title="Új szabály">
          <SkeletonForm submit="Szabály létrehozása">
            <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
              <SkeletonField label="Munkakör" description="Úgy írd, ahogy a HR-rendszer küldi." />
              <SkeletonField label="Szoftver" />
            </div>
          </SkeletonForm>
        </SkeletonCard>
      </SplitLayout>
    </SkeletonPage>
  );
}
