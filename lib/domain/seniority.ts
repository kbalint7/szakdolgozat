export type SenioritySubject = {
  assignedAt: Date;
  eligibleSince: Date;
  hrId: string;
};

export function compareSeniority(a: SenioritySubject, b: SenioritySubject): number {
  return (
    a.assignedAt.getTime() - b.assignedAt.getTime() ||
    a.eligibleSince.getTime() - b.eligibleSince.getTime() ||
    compareText(a.hrId, b.hrId)
  );
}

export function compareWaitlist(
  a: { eligibleSince: Date; hrId: string },
  b: { eligibleSince: Date; hrId: string },
): number {
  return a.eligibleSince.getTime() - b.eligibleSince.getTime() || compareText(a.hrId, b.hrId);
}

export function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
