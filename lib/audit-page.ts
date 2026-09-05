import 'server-only';

import { budapestDayEnd, budapestDayStart, listAuditEntries } from '@/lib/services/audit-queries';
import { auditFilterSchema } from '@/lib/validation/audit';

export async function loadAuditPage(
  companyId: string | null,
  searchParams: Record<string, string | string[] | undefined>,
  basePath: string,
) {
  const filter = auditFilterSchema.parse(searchParams);
  const { entries, nextBefore } = await listAuditEntries({
    companyId,
    category: filter.category,
    hrId: filter.hrId || undefined,
    from: filter.from ? budapestDayStart(filter.from) : undefined,
    to: filter.to ? budapestDayEnd(filter.to) : undefined,
    before: filter.before,
  });

  const query = new URLSearchParams();
  if (filter.category) query.set('category', filter.category);
  if (filter.hrId) query.set('hrId', filter.hrId);
  if (filter.from) query.set('from', filter.from);
  if (filter.to) query.set('to', filter.to);
  if (nextBefore) query.set('before', String(nextBefore));

  return {
    filter,
    entries,
    olderHref: nextBefore ? `${basePath}?${query.toString()}` : null,
  };
}
