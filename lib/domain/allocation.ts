import { compareSeniority, compareWaitlist } from './seniority';

export type EndReason =
  | 'EMPLOYEE_TERMINATED'
  | 'ROLE_NO_LONGER_ELIGIBLE'
  | 'RULE_REMOVED'
  | 'CAPACITY_REDUCED'
  | 'LICENSE_EXPIRED'
  | 'COMPANY_DELETED';

export type GrantReason = 'RULE_MATCHED' | 'SEAT_FREED' | 'CAPACITY_ADDED';

export type EligibleEmployee = {
  employeeId: string;
  hrId: string;
  eligibleSince: Date;
};

export type OpenRow = {
  rowId: string;
  employeeId: string;
  hrId: string;
  status: 'waiting' | 'assigned';
  eligibleSince: Date;
  assignedAt: Date | null;
};

export type PoolInput = {
  capacity: number;
  eligible: readonly EligibleEmployee[];
  current: readonly OpenRow[];
  reasonFor: (employeeId: string) => EndReason;
};

export type PoolAction =
  | { type: 'REVOKE'; rowId: string; employeeId: string; reason: EndReason }
  | { type: 'CANCEL'; rowId: string; employeeId: string; reason: EndReason }
  | { type: 'ENQUEUE'; employeeId: string; hrId: string; eligibleSince: Date }
  | { type: 'REQUEUE'; rowId: string; employeeId: string; hrId: string; eligibleSince: Date }
  | { type: 'ASSIGN'; employeeId: string; reason: GrantReason };

export class InvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantViolation';
  }
}

export function planPool(input: PoolInput): PoolAction[] {
  const capacity = Math.max(0, Math.floor(input.capacity));
  const eligibleById = new Map(input.eligible.map(employee => [employee.employeeId, employee]));
  const ended: PoolAction[] = [];
  const assigned: OpenRow[] = [];
  const waiting: { employeeId: string; hrId: string; eligibleSince: Date; isNew: boolean }[] = [];
  const withRow = new Set<string>();

  for (const row of input.current) {
    if (withRow.has(row.employeeId)) {
      throw new InvariantViolation(`more than one open row for employee ${row.employeeId}`);
    }
    withRow.add(row.employeeId);
    if (!eligibleById.has(row.employeeId)) {
      const reason = input.reasonFor(row.employeeId);
      ended.push(
        row.status === 'assigned'
          ? { type: 'REVOKE', rowId: row.rowId, employeeId: row.employeeId, reason }
          : { type: 'CANCEL', rowId: row.rowId, employeeId: row.employeeId, reason },
      );
    } else if (row.status === 'assigned') {
      assigned.push(row);
    } else {
      waiting.push({ employeeId: row.employeeId, hrId: row.hrId, eligibleSince: row.eligibleSince, isNew: false });
    }
  }
  const freedSeats = ended.filter(action => action.type === 'REVOKE').length;

  const enqueued: PoolAction[] = [];
  for (const employee of input.eligible) {
    if (withRow.has(employee.employeeId)) continue;
    withRow.add(employee.employeeId);
    enqueued.push({
      type: 'ENQUEUE',
      employeeId: employee.employeeId,
      hrId: employee.hrId,
      eligibleSince: employee.eligibleSince,
    });
    waiting.push({ ...employee, isNew: true });
  }

  const requeued: PoolAction[] = [];
  if (assigned.length > capacity) {
    const bySeniority = [...assigned].sort((a, b) => compareSeniority(seniorityOf(a), seniorityOf(b)));
    for (const row of bySeniority.slice(capacity).reverse()) {
      requeued.push({
        type: 'REQUEUE',
        rowId: row.rowId,
        employeeId: row.employeeId,
        hrId: row.hrId,
        eligibleSince: row.eligibleSince,
      });
    }
    assigned.length = 0;
    assigned.push(...bySeniority.slice(0, capacity));
  }

  const assignments: PoolAction[] = [];
  let free = capacity - assigned.length;
  if (free > 0) {
    for (const entry of [...waiting].sort(compareWaitlist)) {
      if (free === 0) break;
      assignments.push({
        type: 'ASSIGN',
        employeeId: entry.employeeId,
        reason: entry.isNew ? 'RULE_MATCHED' : freedSeats > 0 ? 'SEAT_FREED' : 'CAPACITY_ADDED',
      });
      free--;
    }
  }

  const plan = [...ended, ...requeued, ...enqueued, ...assignments];
  assertPlanRespectsCapacity(input, plan, capacity);
  return plan;
}

function seniorityOf(row: OpenRow) {
  if (!row.assignedAt) throw new InvariantViolation(`assigned row ${row.rowId} has no assignedAt`);
  return { assignedAt: row.assignedAt, eligibleSince: row.eligibleSince, hrId: row.hrId };
}

function assertPlanRespectsCapacity(input: PoolInput, plan: PoolAction[], capacity: number) {
  const before = input.current.filter(row => row.status === 'assigned').length;
  const removed = plan.filter(action => action.type === 'REVOKE' || action.type === 'REQUEUE').length;
  const added = plan.filter(action => action.type === 'ASSIGN').length;
  const after = before - removed + added;
  if (after > capacity) {
    throw new InvariantViolation(`plan would assign ${after} seats with capacity ${capacity}`);
  }
}

export function waitlistPositions(waiting: readonly { employeeId: string; eligibleSince: Date; hrId: string }[]) {
  const positions = new Map<string, number>();
  [...waiting].sort(compareWaitlist).forEach((entry, index) => positions.set(entry.employeeId, index + 1));
  return positions;
}
