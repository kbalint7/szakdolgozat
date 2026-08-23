import {
  SkeletonCard,
  SkeletonInlineForm,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonSplit,
  SkeletonStatGrid,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-64" description="w-96" />
      <SkeletonStatGrid />
      <SkeletonSplit>
        <SkeletonCard title="w-48" description="w-full" lines={2}>
          <SkeletonInlineForm submit="w-28" />
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonSection title="w-28" description="w-56">
        <SkeletonTable columns={['w-28', 'w-24', 'w-40', 'w-20', 'w-16', 'w-32', 'w-28']} rows={5} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
