import {
  SkeletonButton,
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="Profil" />
      <Narrow className="gap-4">
        <SkeletonCard title="Személyes adatok">
          <SkeletonForm submit="Mentés">
            <SkeletonField label="Név" />
            <SkeletonField label="E-mail-cím" description="Az e-mail-címeddel jelentkezel be, ezért nem módosítható." />
          </SkeletonForm>
        </SkeletonCard>
        <SkeletonCard
          title="Fiók törlése"
          description="A fiókod és a tagságaid törlődnek. Ha tulajdonosa vagy egy cégnek, előbb add át a tulajdonjogot, vagy töröld a céget."
        >
          <SkeletonButton className="max-sm:w-full">Fiók törlése</SkeletonButton>
        </SkeletonCard>
      </Narrow>
    </SkeletonPage>
  );
}
