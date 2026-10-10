import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonStatGrid,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-64" description="w-2xl" />
      <SkeletonStatGrid hint />
      <SkeletonSection title="w-28" description="w-80">
        <SkeletonTable columns={['w-32', 'w-16', 'w-20', 'w-24', 'w-24', 'w-28', 'w-12']} rows={2} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
