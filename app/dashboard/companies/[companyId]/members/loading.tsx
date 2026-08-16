import { SkeletonPage, SkeletonPageHeader, SkeletonSection, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-48" description="w-2xl" />
      <SkeletonSection title="w-16" description="w-12">
        <SkeletonTable columns={['w-40', 'w-24', 'w-24']} rows={4} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
