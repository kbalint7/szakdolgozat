import {
  SkeletonCallout,
  SkeletonCapacityCard,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonStatGrid,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader back title="w-32" description="w-56" />
      <SkeletonStatGrid />
      <SkeletonCapacityCard />
      <SkeletonSection title="w-24" description="w-96">
        <SkeletonTable columns={['w-6', 'w-36', 'w-24', 'w-32', 'w-28']} rows={1} tall={1} />
      </SkeletonSection>
      <SkeletonSection title="w-36" description="w-2xl">
        <SkeletonTable columns={['w-6', 'w-36', 'w-24', 'w-32', 'w-28', 'w-24']} rows={6} tall={1} />
      </SkeletonSection>
      <SkeletonCallout />
    </SkeletonPage>
  );
}
