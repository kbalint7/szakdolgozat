export type EmployeeState = { status: 'active' | 'terminated'; jobRole: string };
export type RuleLike = { jobRole: string; productId: string };

export function isEligible(employee: EmployeeState, rules: readonly RuleLike[], productId: string): boolean {
  return (
    employee.status === 'active' &&
    rules.some(rule => rule.productId === productId && rule.jobRole === employee.jobRole)
  );
}

export function eligibleProductIds(employee: EmployeeState, rules: readonly RuleLike[]): string[] {
  if (employee.status !== 'active') return [];
  return [...new Set(rules.filter(rule => rule.jobRole === employee.jobRole).map(rule => rule.productId))];
}

export function lossReasonForEmployee(employee: EmployeeState): 'EMPLOYEE_TERMINATED' | 'ROLE_NO_LONGER_ELIGIBLE' {
  return employee.status === 'terminated' ? 'EMPLOYEE_TERMINATED' : 'ROLE_NO_LONGER_ELIGIBLE';
}
