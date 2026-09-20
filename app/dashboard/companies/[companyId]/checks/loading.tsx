import { SkeletonCallout, SkeletonPage, SkeletonPageHeader, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-36" description="w-96" meta={2} />
      <SkeletonTable columns={['w-28', 'w-40', 'w-24', 'w-32']} rows={8} tall={1} footer />
      <SkeletonCallout />
    </SkeletonPage>
  );
}
