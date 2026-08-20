export type LicenseLike = {
  seatCount: number;
  status: 'active' | 'revoked';
  validFrom: Date;
  validUntil: Date | null;
};

export function isLicenseValid(license: LicenseLike, now: Date): boolean {
  return (
    license.status === 'active' &&
    license.validFrom.getTime() <= now.getTime() &&
    (license.validUntil === null || now.getTime() < license.validUntil.getTime())
  );
}

export function poolCapacity(licenses: readonly LicenseLike[], now: Date): number {
  return licenses.reduce((sum, license) => (isLicenseValid(license, now) ? sum + license.seatCount : sum), 0);
}

export function earliestExpiry(licenses: readonly LicenseLike[], now: Date): Date | null {
  let earliest: Date | null = null;
  for (const license of licenses) {
    if (!isLicenseValid(license, now) || license.validUntil === null) continue;
    if (earliest === null || license.validUntil < earliest) earliest = license.validUntil;
  }
  return earliest;
}
