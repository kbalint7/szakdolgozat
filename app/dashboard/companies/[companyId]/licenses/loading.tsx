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
      <SkeletonPageHeader title="w-48" description="w-96" actions={2} />
      <SkeletonStatGrid />
      <SkeletonSection title="w-48" description="w-96">
        <SkeletonTable columns={['w-32', 'w-14', 'w-14', 'w-14', 'w-16', 'w-40', 'w-24']} rows={1} />
      </SkeletonSection>
      <SkeletonSplit asideLines={6}>
        <SkeletonCard title="w-44" description="w-96">
          <SkeletonInlineForm submit="w-24" />
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonSection title="w-20" description="w-96">
        <SkeletonTable columns={['w-32', 'w-24', 'w-14', 'w-40', 'w-20', 'w-28']} rows={1} />
      </SkeletonSection>
      <SkeletonSection title="w-24" description="w-56">
        <SkeletonTable columns={['w-32', 'w-40', 'w-20', 'w-32', 'w-28']} rows={1} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
