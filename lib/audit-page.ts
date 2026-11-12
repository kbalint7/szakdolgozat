import 'server-only';

import { AUDIT_PAGE_SIZE, budapestDayEnd, budapestDayStart, listAuditEntries } from '@/lib/services/audit-queries';
import { auditFilterSchema } from '@/lib/validation/audit';

const MAX_ENTRIES = 1000;

function pageLimit(asked: number | undefined): number {
  if (!asked || asked <= AUDIT_PAGE_SIZE) return AUDIT_PAGE_SIZE;
  return Math.min(Math.ceil(asked / AUDIT_PAGE_SIZE) * AUDIT_PAGE_SIZE, MAX_ENTRIES);
}

export async function loadAuditPage(
  companyId: string | null,
  searchParams: Record<string, string | string[] | undefined>,
  basePath: string,
) {
  const filter = auditFilterSchema.parse(searchParams);
  const limit = pageLimit(filter.limit);
  const { entries, total } = await listAuditEntries({
    companyId,
    category: filter.category,
    hrId: (companyId && filter.hrId) || undefined,
    companyName: (!companyId && filter.company) || undefined,
    from: filter.from ? budapestDayStart(filter.from) : undefined,
    to: filter.to ? budapestDayEnd(filter.to) : undefined,
    limit,
  });

  const query = new URLSearchParams();
  if (filter.category) query.set('category', filter.category);
  if (companyId && filter.hrId) query.set('hrId', filter.hrId);
  if (!companyId && filter.company) query.set('company', filter.company);
  if (filter.from) query.set('from', filter.from);
  if (filter.to) query.set('to', filter.to);
  query.set('limit', String(limit + AUDIT_PAGE_SIZE));

  return {
    filter,
    filtered: Boolean(filter.category || filter.from || filter.to || (companyId ? filter.hrId : filter.company)),
    entries,
    more:
      entries.length < total && limit < MAX_ENTRIES
        ? { href: `${basePath}?${query.toString()}`, shown: entries.length, total }
        : null,
  };
}
