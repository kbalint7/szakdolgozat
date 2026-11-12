export const seatReasonLabels: Record<string, string> = {
  EMPLOYEE_TERMINATED: 'kilépett',
  ROLE_NO_LONGER_ELIGIBLE: 'a munkaköréhez már nem jár',
  RULE_REMOVED: 'a szabályt törölték',
  CAPACITY_REDUCED: 'kevesebb lett a hely',
  LICENSE_EXPIRED: 'lejárt a licenc',
  COMPANY_DELETED: 'a céget törölték',
  RULE_MATCHED: 'a munkaköréhez jár',
  SEAT_FREED: 'felszabadult egy hely',
  CAPACITY_ADDED: 'több lett a hely',
  ACCOUNT_DELETED: 'a felhasználói fiókot törölték',
};

export function seatReasonLabel(code: string | null | undefined): string {
  if (!code) return '–';
  return seatReasonLabels[code] ?? code;
}
