import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader back title="w-40" description="w-96" meta={2} actions={1} />
      <SkeletonSection title="w-24" description="w-2xl" actions>
        <SkeletonTable columns={['w-28', 'w-16', 'w-24', 'w-20', 'w-16', 'w-32']} rows={3} mono={5} />
      </SkeletonSection>
      <SkeletonCard title="w-28" description="w-2xl">
        <SkeletonForm submit="w-20" className="max-w-2xl">
          <SkeletonField />
          <SkeletonField described />
          <SkeletonField described />
          <SkeletonField kind="textarea" />
        </SkeletonForm>
      </SkeletonCard>
    </SkeletonPage>
  );
}
