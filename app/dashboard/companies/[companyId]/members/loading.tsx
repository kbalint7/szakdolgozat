import {
  SkeletonCard,
  SkeletonField,
  SkeletonFieldRow,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonSplit,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-48" description="w-2xl" />
      <SkeletonSection title="w-16" description="w-12">
        <SkeletonTable columns={['w-40', 'w-24', 'w-20', 'w-24']} rows={4} />
      </SkeletonSection>
      <SkeletonSplit asideLines={5}>
        <SkeletonCard title="w-24" description="w-full" lines={2}>
          <SkeletonForm submit="w-40">
            <SkeletonFieldRow cols="sm:grid-cols-[1fr_12rem]">
              <SkeletonField />
              <SkeletonField />
            </SkeletonFieldRow>
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonSection title="w-24" description="w-2xl">
        <SkeletonTable columns={['w-40', 'w-20', 'w-16', 'w-24', 'w-28', 'w-20']} rows={1} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
