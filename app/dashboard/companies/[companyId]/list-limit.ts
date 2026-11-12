export const LIST_PAGE = 25;

const LIST_MAX = 1000;

export function parseListLimit(value: string | string[] | undefined): number {
  const asked = typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(asked) || asked <= LIST_PAGE) return LIST_PAGE;
  return Math.min(Math.ceil(asked / LIST_PAGE) * LIST_PAGE, LIST_MAX);
}

export function parseListSearch(value: string | string[] | undefined): string | undefined {
  return (typeof value === 'string' && value.trim().slice(0, 100)) || undefined;
}

export function moreHref(path: string, filters: Record<string, string | undefined>, limit: number): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value) query.set(name, value);
  }
  query.set('limit', String(limit + LIST_PAGE));
  return `${path}?${query}`;
}
