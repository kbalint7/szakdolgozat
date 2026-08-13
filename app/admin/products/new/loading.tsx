import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSplit,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader back title="w-28" description="w-96" />
      <SkeletonSplit asideLines={2}>
        <SkeletonCard title={false} description={false}>
          <SkeletonForm className="max-w-2xl">
            <SkeletonField />
            <SkeletonField described />
            <SkeletonField described />
            <SkeletonField kind="textarea" />
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
    </SkeletonPage>
  );
}
