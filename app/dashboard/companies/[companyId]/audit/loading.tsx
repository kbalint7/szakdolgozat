import { AuditLogSkeleton } from '@/components/audit/audit-skeleton';
import { SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Auditnapló"
        description="Ki mit változtatott és miért. A bejegyzéseket utólag senki sem módosíthatja."
      />
      <AuditLogSkeleton />
    </SkeletonPage>
  );
}
