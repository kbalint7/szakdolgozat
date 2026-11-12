import { Detail, DetailAction, DetailList } from '@/components/detail-list';
import {
  SkeletonPage,
  SkeletonRowAction,
  SkeletonSeatMeter,
  SkeletonSection,
  SkeletonStatStrip,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';
import { TwoLine } from '@/components/table-card';
import { Card, CardContent } from '@/components/ui/card';

export function ManagerBodySkeleton() {
  return (
    <SkeletonPage>
      <SkeletonStatStrip
        linked
        stats={[
          ['Tagok', '3'],
          ['Aktív munkavállalók', '25'],
          ['Várólistán', '2'],
        ]}
      />
      <SkeletonSection title="Helyek szoftverenként">
        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-4 rounded-xl bg-card py-4 pr-4 pl-5 shadow-card ring-1 ring-border">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-semibold tracking-tight">
                  <SkeletonText>IDE Pro</SkeletonText>
                </span>
                <span className="text-[13px] whitespace-nowrap">
                  <SkeletonText>2027. 01. 01-ig</SkeletonText>
                </span>
              </div>
              <SkeletonSeatMeter />
            </div>
            <span className="size-4 shrink-0" />
          </li>
        </ul>
      </SkeletonSection>
    </SkeletonPage>
  );
}

export function MemberBodySkeleton() {
  return (
    <SkeletonPage>
      <Narrow>
        <Card>
          <CardContent>
            <DetailList className="sm:grid-cols-2">
              <Detail label={<SkeletonText>Szerepkör</SkeletonText>}>
                <SkeletonText>Tag</SkeletonText>
              </Detail>
              <Detail label={<SkeletonText>A céget kezeli</SkeletonText>}>
                <SkeletonText>Példa Tulajdonos</SkeletonText>
              </Detail>
              <Detail label={<SkeletonText>Munkavállalói adatok</SkeletonText>}>
                <SkeletonText>Kiss Anna E-1001</SkeletonText>
              </Detail>
              <Detail label={<SkeletonText>Munkakör</SkeletonText>}>
                <SkeletonText>developer</SkeletonText>
              </Detail>
            </DetailList>
            <DetailAction>
              <SkeletonRowAction className="mr-0 -ml-2.5">Kilépés a cégből</SkeletonRowAction>
            </DetailAction>
          </CardContent>
        </Card>

        <SkeletonSection title="Szoftvereim" count>
          <SkeletonTable
            rows={1}
            columns={[
              {
                head: 'w-full md:w-60 lg:w-64',
                label: 'Szoftver',
                cell: 'max-md:whitespace-normal',
                content: (
                  <>
                    <span className="block truncate font-medium max-lg:hidden">
                      <SkeletonText>IDE Pro</SkeletonText>
                    </span>
                    <TwoLine
                      className="lg:hidden"
                      title={<SkeletonText>IDE Pro</SkeletonText>}
                      sub={<SkeletonText>2027. 01. 01-ig</SkeletonText>}
                    />
                  </>
                ),
              },
              {
                head: 'hidden lg:table-cell lg:w-44',
                label: 'Érvényes',
                cell: 'hidden lg:table-cell',
                content: <SkeletonText>2027. 01. 01-ig</SkeletonText>,
              },
              { label: 'Állapot', content: <SkeletonStatus>Használható</SkeletonStatus> },
            ]}
          />
        </SkeletonSection>
      </Narrow>
    </SkeletonPage>
  );
}
