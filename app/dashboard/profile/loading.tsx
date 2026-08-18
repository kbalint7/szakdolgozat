import {
  SkeletonButton,
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-24" description="w-32" />
      <SkeletonCard title="w-36" description="w-80">
        <SkeletonForm submit="w-24" className="max-w-xl">
          <SkeletonField />
          <SkeletonField />
        </SkeletonForm>
      </SkeletonCard>
      <SkeletonCard title="w-28" description="w-full">
        <SkeletonButton w="w-28" />
      </SkeletonCard>
    </SkeletonPage>
  );
}
