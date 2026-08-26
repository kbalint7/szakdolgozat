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
      <SkeletonPageHeader title="w-56" description="w-2xl" lines={2} />
      <SkeletonSplit asideLines={5}>
        <SkeletonCard title="w-24" description="w-96">
          <SkeletonForm submit="w-40">
            <SkeletonFieldRow>
              <SkeletonField described={3} />
              <SkeletonField />
            </SkeletonFieldRow>
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonSection title="w-24" description="w-16">
        <SkeletonTable columns={['w-24', 'w-32', 'w-16', 'w-20', 'w-20', 'w-24']} rows={2} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
