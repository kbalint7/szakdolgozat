import { SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-64" description="w-72" />
    </SkeletonPage>
  );
}
