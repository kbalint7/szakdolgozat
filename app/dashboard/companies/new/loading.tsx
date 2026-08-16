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
      <SkeletonPageHeader title="w-24" />
      <SkeletonSplit asideLines={5}>
        <SkeletonCard title={false} description={false}>
          <SkeletonForm className="max-w-xl">
            <SkeletonField />
            <SkeletonField kind="textarea" />
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
    </SkeletonPage>
  );
}
