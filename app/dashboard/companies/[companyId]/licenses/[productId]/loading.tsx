import {
  SkeletonChevron,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSeatMeter,
  SkeletonSection,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';

const names = ['Kiss Anna', 'Nagy Bence', 'Tóth Csilla', 'Szabó Dániel', 'Horváth Eszter'];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="Példa Kft. › Licencek és helyek"
        title="IDE Pro"
        description="Ki kapott helyet ebből a szoftverből, és ki vár rá."
      />
      <Narrow>
        <div className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-border">
          <SkeletonSeatMeter size="lg" seats={22} />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <SkeletonText>■ kiosztott hely</SkeletonText>
              <SkeletonText>■ várólistán</SkeletonText>
            </div>
            <span className="text-[13px] whitespace-nowrap">
              <SkeletonText>Érvényes 2027. nov. 10-ig</SkeletonText>
            </span>
          </div>
        </div>

        <SkeletonSection title="Kiosztott helyek" count>
          <SkeletonTable
            rows={10}
            header="max-md:hidden"
            columns={[
              {
                head: 'w-px pr-0 text-right md:w-12',
                label: '#',
                cell: 'pr-0 text-right align-top',
                content: row => (
                  <span className="leading-5">
                    <SkeletonText>{row + 1}.</SkeletonText>
                  </span>
                ),
              },
              {
                head: 'w-full md:w-auto lg:w-96',
                label: 'Munkavállaló',
                content: row => (
                  <>
                    <div className="flex min-w-0 items-center gap-2 leading-5">
                      <span className="min-w-0 truncate font-medium">
                        <SkeletonText>{names[row % names.length]}</SkeletonText>
                      </span>
                    </div>
                    <div>
                      <SkeletonMeta className="leading-4 max-lg:hidden" items={['E-1001']} />
                      <SkeletonMeta
                        className="leading-4 lg:hidden"
                        items={['E-1001', 'kiosztva: 2026. jan. 10. 15:18']}
                      />
                    </div>
                  </>
                ),
              },
              {
                head: 'hidden lg:table-cell lg:w-44',
                label: 'Kiosztva',
                cell: 'hidden lg:table-cell',
                content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
              },
              { head: 'w-px md:w-auto md:max-lg:w-12', cell: 'w-px pr-4 pl-0 md:w-auto', content: <SkeletonChevron /> },
            ]}
          />
        </SkeletonSection>
      </Narrow>
    </SkeletonPage>
  );
}
