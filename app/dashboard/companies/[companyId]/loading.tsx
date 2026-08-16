import { SkeletonPage, SkeletonPageHeader, SkeletonStatGrid } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-48" description="w-80" meta={2} />
      <SkeletonStatGrid count={1} />
    </SkeletonPage>
  );
}
