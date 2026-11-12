import {
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonStatStrip,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const count = (width: string, breakpoint: 'lg' | 'xl' | 'min-[87.5rem]') => {
  const hidden = `hidden text-right ${breakpoint}:table-cell`;
  return { head: `${hidden} ${width}`, cell: `nums ${hidden}`, content: <SkeletonText>25</SkeletonText> };
};

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Statisztika"
        description="Vásárlások és kézzel kiadott kulcsok, a rendeléskor érvényes árakon."
      />
      <SkeletonStatStrip
        stats={[
          ['Rendelések', '3'],
          ['Bevétel', '780 000 Ft'],
          ['Érvényes helyek', '30'],
        ]}
      />
      <SkeletonSection title="Termékenként">
        <SkeletonTable
          rows={2}
          columns={[
            {
              head: 'w-full md:w-auto',
              label: 'Termék',
              cell: 'max-lg:whitespace-normal',
              content: row => (
                <>
                  <div className="truncate leading-5 font-medium">
                    <SkeletonText>{row ? 'Office Suite' : 'IDE Pro'}</SkeletonText>
                  </div>
                  <SkeletonMeta className="lg:hidden" items={['2 rendelés', '25 hely']} />
                </>
              ),
            },
            { ...count('lg:w-26', 'lg'), label: 'Rendelések' },
            { ...count('min-[87.5rem]:w-28', 'min-[87.5rem]'), label: 'Kézzel kiadott' },
            { ...count('xl:w-32', 'xl'), label: 'Eladott helyek' },
            { ...count('xl:w-36', 'xl'), label: 'Érvényes licencek' },
            { ...count('min-[87.5rem]:w-18', 'min-[87.5rem]'), label: 'Cégek' },
            {
              head: 'text-right md:w-32',
              label: 'Bevétel',
              cell: 'nums text-right',
              content: <SkeletonText>690 000 Ft</SkeletonText>,
            },
            {
              head: 'max-lg:text-right max-md:pl-0 md:w-28 lg:w-50',
              label: 'Részesedés',
              cell: 'max-md:pl-0',
              content: (
                <div className="flex items-center justify-end gap-2.5">
                  <Skeleton className="h-1.5 min-w-0 flex-1 rounded-full max-lg:hidden" />
                  <span className="nums w-9 text-right text-[13px]">
                    <SkeletonText>88%</SkeletonText>
                  </span>
                </div>
              ),
            },
          ]}
        />
      </SkeletonSection>
    </SkeletonPage>
  );
}
