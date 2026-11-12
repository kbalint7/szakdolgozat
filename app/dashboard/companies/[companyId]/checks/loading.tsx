import {
  SkeletonFilterBar,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { TwoLine } from '@/components/table-card';

const users = [
  ['Kiss Anna', 'anna.kiss@pelda.test'],
  ['Nagy Bence Gábor', 'bence.nagy@pelda.test'],
  ['Szabó Dóra', 'dora.szabo@pelda.test'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Ellenőrzések"
        description="Ki mikor próbálta használni a cég szoftvereit, és mi lett az eredmény."
      />
      <div className="flex flex-col gap-4">
        <SkeletonFilterBar chips={['Mind 5', 'Engedélyezve 3', 'Elutasítva 2']} />
        <SkeletonTable
          rows={5}
          header="max-md:hidden"
          columns={[
            {
              head: 'hidden xl:table-cell xl:w-44',
              label: 'Időpont',
              cell: 'hidden xl:table-cell',
              content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
            },
            {
              head: 'w-full max-xl:pl-5 md:w-72 xl:w-[22rem]',
              label: 'Felhasználó',
              cell: 'max-xl:pl-5 max-md:whitespace-normal',
              content: row => (
                <TwoLine
                  title={
                    <span className="block truncate max-md:pr-32">
                      <SkeletonText>{users[row % users.length][0]}</SkeletonText>
                    </span>
                  }
                  sub={
                    <>
                      <span className="block truncate max-xl:hidden">
                        <SkeletonText>{users[row % users.length][1]}</SkeletonText>
                      </span>
                      <SkeletonMeta className="xl:hidden" items={['IDE Pro', '2026. jan. 10. 15:18']} />
                    </>
                  }
                />
              ),
            },
            {
              head: 'hidden xl:table-cell xl:w-48',
              label: 'Szoftver',
              cell: 'hidden xl:table-cell',
              content: <SkeletonText>IDE Pro</SkeletonText>,
            },
            {
              head: 'max-md:hidden',
              label: 'Eredmény',
              cell: 'max-md:absolute max-md:top-2.5 max-md:right-5 max-md:h-auto max-md:p-0 max-md:last:pr-0',
              content: <SkeletonStatus>Engedélyezve</SkeletonStatus>,
            },
          ]}
        />
      </div>
    </SkeletonPage>
  );
}
