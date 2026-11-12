import { SkeletonField, SkeletonForm } from '@/components/page-skeleton';

export function ProductFormSkeleton({ submit }: { submit: string }) {
  return (
    <SkeletonForm submit={submit}>
      <SkeletonField label="Név" />
      <SkeletonField
        label="Azonosító"
        description="Kisbetű, számjegy és kötőjel, pl. ide-pro. A szoftverek ezzel kérdezik le a licencet, ezért ha módosítod, bennük is át kell írni."
      />
      <SkeletonField
        label="Rövid leírás (nem kötelező)"
        kind="textarea"
        description="A katalógus listájában jelenik meg."
      />
      <SkeletonField label="Leírás (nem kötelező)" kind="textarea" control="h-28" />
    </SkeletonForm>
  );
}
