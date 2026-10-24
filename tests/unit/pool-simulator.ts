import type { EligibleEmployee, OpenRow, PoolAction } from '@/lib/domain/allocation';

export type SimRow = OpenRow & { endedReason?: string };

export function applyPlan(current: readonly OpenRow[], plan: readonly PoolAction[], now: Date): OpenRow[] {
  let rows = current.map(row => ({ ...row }));
  let nextId = 0;
  const newId = () => `new-${now.getTime()}-${nextId++}`;

  for (const action of plan) {
    switch (action.type) {
      case 'REVOKE':
      case 'CANCEL':
        rows = rows.filter(row => row.rowId !== action.rowId);
        break;
      case 'REQUEUE':
        rows = rows.filter(row => row.rowId !== action.rowId);
        rows.push({
          rowId: newId(),
          employeeId: action.employeeId,
          hrId: action.hrId,
          status: 'waiting',
          eligibleSince: action.eligibleSince,
          assignedAt: null,
        });
        break;
      case 'ENQUEUE':
        rows.push({
          rowId: newId(),
          employeeId: action.employeeId,
          hrId: action.hrId,
          status: 'waiting',
          eligibleSince: action.eligibleSince,
          assignedAt: null,
        });
        break;
      case 'ASSIGN': {
        const row = rows.find(r => r.employeeId === action.employeeId && r.status === 'waiting');
        if (!row) throw new Error(`ASSIGN without waiting row for ${action.employeeId}`);
        row.status = 'assigned';
        row.assignedAt = now;
        break;
      }
    }
  }
  return rows;
}

export function employee(n: number, eligibleSince: Date): EligibleEmployee {
  return { employeeId: `emp-${n}`, hrId: `E-${String(n).padStart(4, '0')}`, eligibleSince };
}

export function assignedRow(n: number, eligibleSince: Date, assignedAt: Date): OpenRow {
  return {
    rowId: `row-${n}`,
    employeeId: `emp-${n}`,
    hrId: `E-${String(n).padStart(4, '0')}`,
    status: 'assigned',
    eligibleSince,
    assignedAt,
  };
}

export function waitingRow(n: number, eligibleSince: Date): OpenRow {
  return {
    rowId: `row-${n}`,
    employeeId: `emp-${n}`,
    hrId: `E-${String(n).padStart(4, '0')}`,
    status: 'waiting',
    eligibleSince,
    assignedAt: null,
  };
}

export const t = (minutes: number) => new Date(Date.UTC(2026, 10, 3, 9, 0) + minutes * 60_000);
