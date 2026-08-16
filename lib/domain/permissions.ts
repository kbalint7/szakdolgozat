export type Role = 'owner' | 'admin' | 'member';

export type CompanyAction =
  | 'company.view'
  | 'company.leave'
  | 'company.edit'
  | 'company.delete'
  | 'members.changeRole'
  | 'company.transferOwnership'
  | 'members.view'
  | 'members.invite'
  | 'members.remove'
  | 'licenses.purchase'
  | 'licenses.activate'
  | 'licenses.view'
  | 'rules.manage'
  | 'employees.view'
  | 'employees.manage'
  | 'apiKeys.manage'
  | 'hrEvents.view'
  | 'hrEvents.retry'
  | 'pools.reconcile'
  | 'audit.view'
  | 'checks.view';

const OWNER: Role[] = ['owner'];
const ADMINS: Role[] = ['owner', 'admin'];
const EVERYONE: Role[] = ['owner', 'admin', 'member'];

const matrix: Record<CompanyAction, readonly Role[]> = {
  'company.view': EVERYONE,
  'company.leave': ['admin', 'member'],
  'company.edit': OWNER,
  'company.delete': OWNER,
  'members.changeRole': OWNER,
  'company.transferOwnership': OWNER,
  'members.view': ADMINS,
  'members.invite': ADMINS,
  'members.remove': ADMINS,
  'licenses.purchase': ADMINS,
  'licenses.activate': ADMINS,
  'licenses.view': ADMINS,
  'rules.manage': ADMINS,
  'employees.view': ADMINS,
  'employees.manage': ADMINS,
  'apiKeys.manage': ADMINS,
  'hrEvents.view': ADMINS,
  'hrEvents.retry': ADMINS,
  'pools.reconcile': ADMINS,
  'audit.view': ADMINS,
  'checks.view': ADMINS,
};

export function can(role: Role, action: CompanyAction): boolean {
  return matrix[action].includes(role);
}

export function canRemoveMember(actorRole: Role, targetRole: Role): boolean {
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  return actorRole === 'admin' && targetRole === 'member';
}

export const roleLabels: Record<Role, string> = {
  owner: 'Tulajdonos',
  admin: 'Adminisztrátor',
  member: 'Tag',
};
