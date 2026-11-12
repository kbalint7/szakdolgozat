import {
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Szoftvereim"
        description="Melyik szoftvert melyik cégtől kaptad, és hol tartasz a várólistán."
      />
      <Narrow>
        <SkeletonTable
          rows={1}
          columns={[
            {
              head: 'w-full md:w-60 lg:w-44',
              label: 'Szoftver',
              cell: 'max-lg:whitespace-normal',
              content: (
                <>
                  <div className="truncate leading-5 font-medium">
                    <SkeletonText>IDE Pro</SkeletonText>
                  </div>
                  <SkeletonMeta className="lg:hidden" items={['Példa Kft.', '2027. 01. 01-ig']} />
                </>
              ),
            },
            {
              head: 'hidden lg:table-cell lg:w-40',
              label: 'Cég',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>Példa Kft.</SkeletonText>,
            },
            {
              head: 'hidden lg:table-cell lg:w-40',
              label: 'Érvényes',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>2027. 01. 01-ig</SkeletonText>,
            },
            { label: 'Állapot', content: <SkeletonStatus>Használható</SkeletonStatus> },
          ]}
        />
      </Narrow>
    </SkeletonPage>
  );
}
