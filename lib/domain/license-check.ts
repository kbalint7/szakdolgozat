export type DenyReason = 'NOT_MEMBER' | 'NOT_LINKED' | 'NOT_ELIGIBLE' | 'WAITLISTED' | 'NO_VALID_LICENSE';

const specificity: Record<DenyReason, number> = {
  WAITLISTED: 5,
  NO_VALID_LICENSE: 4,
  NOT_ELIGIBLE: 3,
  NOT_LINKED: 2,
  NOT_MEMBER: 1,
};

export type CompanyEvaluation = {
  companyId: string;
  companyName: string;
  employee: null | {
    seat: null | { status: 'waiting'; position: number } | { status: 'assigned'; assignedAt: Date; rank: number };
  };
  capacity: number;
};

export type CheckDecision =
  | { allowed: true; companyId: string; companyName: string; assignedAt: Date }
  | { allowed: false; reason: DenyReason; waitlistPosition?: number; companyId?: string };

function evaluate(company: CompanyEvaluation): CheckDecision {
  if (!company.employee) return { allowed: false, reason: 'NOT_LINKED', companyId: company.companyId };
  const seat = company.employee.seat;
  if (!seat) return { allowed: false, reason: 'NOT_ELIGIBLE', companyId: company.companyId };
  if (seat.status === 'waiting') {
    return { allowed: false, reason: 'WAITLISTED', waitlistPosition: seat.position, companyId: company.companyId };
  }
  if (seat.rank > company.capacity) return { allowed: false, reason: 'NO_VALID_LICENSE', companyId: company.companyId };
  return { allowed: true, companyId: company.companyId, companyName: company.companyName, assignedAt: seat.assignedAt };
}

export function decideCheck(companies: readonly CompanyEvaluation[]): CheckDecision {
  if (companies.length === 0) return { allowed: false, reason: 'NOT_MEMBER' };
  const decisions = companies.map(evaluate);
  const allowed = decisions.find(decision => decision.allowed);
  if (allowed) return allowed;
  return decisions.reduce((best, decision) => {
    if (best.allowed || decision.allowed) return best;
    const better = specificity[decision.reason] > specificity[best.reason];
    const closer =
      decision.reason === 'WAITLISTED' &&
      best.reason === 'WAITLISTED' &&
      (decision.waitlistPosition ?? Infinity) < (best.waitlistPosition ?? Infinity);
    return better || closer ? decision : best;
  });
}
