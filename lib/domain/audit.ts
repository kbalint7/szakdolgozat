export const AUDIT_CATEGORIES = [
  'seat',
  'employee',
  'hr_event',
  'rule',
  'license',
  'license_key',
  'order',
  'membership',
  'invitation',
  'company',
  'product',
  'plan',
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
