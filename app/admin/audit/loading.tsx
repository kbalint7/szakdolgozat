import { AuditLogSkeleton } from '@/components/audit/audit-skeleton';
import { SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Auditnapló"
        description="Ki mit változtatott és miért, az összes cégben és a platformon."
      />
      <AuditLogSkeleton showCompany />
    </SkeletonPage>
  );
}
