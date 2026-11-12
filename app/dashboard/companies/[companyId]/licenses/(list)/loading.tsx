import {
  SkeletonButton,
  SkeletonCallout,
  SkeletonCard,
  SkeletonChevron,
  SkeletonField,
  SkeletonForm,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSeatMeter,
  SkeletonSection,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { SplitLayout } from '@/components/split-layout';
import { TwoLine } from '@/components/table-card';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Licencek és helyek"
        description="Hány helye van a cégnek az egyes szoftverekből, és ebből mennyi foglalt."
        actions={<SkeletonButton>Vásárlás</SkeletonButton>}
      />

      <SkeletonSection
        title="Helyek szoftverenként"
        actions={<SkeletonButton size="sm">Helyek újraszámolása</SkeletonButton>}
      >
        <SkeletonTable
          rows={1}
          table="max-md:table-fixed"
          header="max-lg:hidden"
          columns={[
            {
              head: 'md:w-96 lg:w-64 xl:w-72',
              label: 'Szoftver',
              cell: 'md:w-96 lg:w-64 xl:w-72 whitespace-normal',
              content: (
                <>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate font-medium">
                      <SkeletonText>IDE Pro</SkeletonText>
                    </span>
                  </span>
                  <SkeletonSeatMeter seats={22} className="mt-1.5 mb-0.5 lg:hidden" />
                </>
              ),
            },
            {
              head: 'hidden lg:table-cell lg:w-[25rem] xl:w-[36rem]',
              label: 'Helyek',
              cell: 'hidden lg:table-cell',
              content: <SkeletonSeatMeter seats={22} className="flex-nowrap" />,
            },
            {
              head: 'w-px md:w-auto max-md:w-10',
              cell: 'w-px pr-4 pl-0 md:w-auto max-md:w-10',
              content: <SkeletonChevron />,
            },
          ]}
        />
      </SkeletonSection>

      <SkeletonSection title="Licencek" count>
        <SkeletonTable
          rows={1}
          columns={[
            {
              head: 'w-full md:w-60 lg:w-64 xl:w-72',
              label: 'Szoftver és csomag',
              cell: 'max-md:whitespace-normal',
              content: (
                <TwoLine
                  title={<SkeletonText>IDE Pro</SkeletonText>}
                  sub={
                    <>
                      <SkeletonMeta className="max-lg:hidden" items={['Részleg', '20 hely']} />
                      <SkeletonMeta
                        className="lg:hidden"
                        items={['Részleg', '20 hely', '2027. nov. 10-ig', '…RYSW', '540 000 Ft']}
                      />
                    </>
                  }
                />
              ),
            },
            {
              head: 'hidden lg:table-cell lg:w-40',
              label: 'Érvényes',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>2027. nov. 10-ig</SkeletonText>,
            },
            {
              head: 'xl:w-44',
              label: 'Állapot',
              cell: 'max-md:align-top',
              content: <SkeletonStatus>Érvényes</SkeletonStatus>,
            },
            {
              head: 'hidden min-[1400px]:w-44 xl:table-cell',
              label: 'Forrás',
              cell: 'hidden xl:table-cell',
              content: (
                <TwoLine
                  className="[&>div:first-child]:font-normal"
                  title={<SkeletonText>Vásárlás</SkeletonText>}
                  sub={<SkeletonText>Példa Tulajdonos</SkeletonText>}
                />
              ),
            },
            {
              head: 'hidden min-[1400px]:table-cell',
              label: 'Kulcs vége',
              cell: 'hidden min-[1400px]:table-cell',
              content: <SkeletonText>…RYSW</SkeletonText>,
            },
            {
              head: 'hidden text-right xl:table-cell xl:w-32',
              label: 'Ár',
              cell: 'hidden text-right xl:table-cell',
              content: <SkeletonText>540 000 Ft</SkeletonText>,
            },
          ]}
        />
      </SkeletonSection>

      <SplitLayout
        aside={
          <SkeletonCallout title="Aktiválás és lejárat">
            Ha aktiválsz egy kulcsot, a helyeit rögtön megkapják azok, akik a legrégebb óta várnak. Ha egy licenc lejár,
            vagy visszavonják, és így nem jut mindenkinek hely, azok veszítik el a helyüket, akik utoljára kaptak. Ők
            visszakerülnek a várólistára, oda, ahol korábban álltak.
          </SkeletonCallout>
        }
      >
        <SkeletonCard title="Licenckulcs aktiválása">
          <SkeletonForm submit="Aktiválás">
            <SkeletonField label="Licenckulcs" />
          </SkeletonForm>
        </SkeletonCard>
      </SplitLayout>
    </SkeletonPage>
  );
}
