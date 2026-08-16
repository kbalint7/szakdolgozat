import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-32" description="w-64" />
      <SkeletonCard title="w-24" description="w-64">
        <SkeletonForm submit="w-24" className="max-w-xl">
          <SkeletonField />
          <SkeletonField kind="textarea" />
        </SkeletonForm>
      </SkeletonCard>
      <SkeletonCard title="w-28" description="w-full" lines={2}>
        <SkeletonForm submit="w-44" className="max-w-xl">
          <SkeletonField />
        </SkeletonForm>
      </SkeletonCard>
    </SkeletonPage>
  );
}
