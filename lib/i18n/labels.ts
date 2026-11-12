export const hrEventTypeLabels: Record<string, string> = {
  'employee.hired': 'Belépés',
  'employee.role_changed': 'Munkakörváltás',
  'employee.terminated': 'Kilépés',
};

export const hrEventStatusLabels: Record<string, string> = {
  pending: 'Függőben',
  processed: 'Feldolgozva',
  stale: 'Elavult',
  failed: 'Sikertelen',
  duplicate: 'Többször érkezett',
  retrying: 'Újra megpróbáljuk',
};

export const employeeStatusLabels: Record<string, string> = {
  active: 'Aktív',
  terminated: 'Kilépett',
};

export const hrEventSourceLabels: Record<string, string> = {
  api: 'HR-rendszer',
  ui: 'Kézi rögzítés',
};

export const checkReasonLabels: Record<string, string> = {
  NOT_MEMBER: 'nem tagja egy cégnek sem',
  NOT_LINKED: 'nincs összekapcsolva munkavállalóval',
  NOT_ELIGIBLE: 'a munkaköréhez nem jár',
  WAITLISTED: 'várólistán áll',
  NO_VALID_LICENSE: 'nincs érvényes licenc',
  PRODUCT_NOT_FOUND: 'ismeretlen szoftver',
};

export const actorTypeLabels: Record<string, string> = {
  user: 'Felhasználó',
  api_key: 'API-kulcs',
  system: 'Rendszer',
};

export const auditActionLabels: Record<string, string> = {
  'product.created': 'Termék létrehozva',
  'product.updated': 'Termék módosítva',
  'product.published': 'Termék publikálva',
  'product.unpublished': 'Termék elrejtve',
  'plan.created': 'Csomag létrehozva',
  'plan.updated': 'Csomag módosítva',
  'plan.activated': 'Csomag aktiválva',
  'plan.deactivated': 'Csomag inaktiválva',
  'company.created': 'Cég létrehozva',
  'company.updated': 'Cég módosítva',
  'company.deleted': 'Cég törölve',
  'company.reconciled': 'Helyek újraszámolva',
  'company.ownership_transferred': 'Tulajdonjog átadva',
  'membership.created': 'Új tag a cégben',
  'membership.removed': 'Tag eltávolítva',
  'membership.left': 'Tag kilépett',
  'membership.role_changed': 'Szerepkör módosítva',
  'membership.linked': 'Fiók összekapcsolva a munkavállalóval',
  'membership.unlinked': 'Fiók leválasztva a munkavállalóról',
  'invitation.created': 'Meghívó létrehozva',
  'invitation.accepted': 'Meghívó elfogadva',
  'invitation.declined': 'Meghívó elutasítva',
  'invitation.revoked': 'Meghívó visszavonva',
  'invitation.link_regenerated': 'Új meghívólink készült',
  'order.placed': 'Rendelés leadva',
  'license_key.issued': 'Licenckulcs kiadva',
  'license_key.revoked': 'Licenckulcs visszavonva',
  'license.activated': 'Licenc aktiválva',
  'license.revoked': 'Licenc visszavonva',
  'license.expired': 'Licenc lejárt',
  'rule.created': 'Szabály létrehozva',
  'rule.deleted': 'Szabály törölve',
  'api_key.created': 'API-kulcs létrehozva',
  'api_key.revoked': 'API-kulcs visszavonva',
  'client_token.created': 'Klienstoken létrehozva',
  'client_token.revoked': 'Klienstoken visszavonva',
  'employee.hired': 'Munkavállaló belépett',
  'employee.rehired': 'Munkavállaló újra belépett',
  'employee.role_changed': 'Munkakör megváltozott',
  'employee.terminated': 'Munkavállaló kilépett',
  'hr_event.stale': 'Elavult esemény kihagyva',
  'hr_event.retry_requested': 'Újrapróbálás indítva',
  'seat.queued': 'Várólistára került',
  'seat.assigned': 'Helyet kapott',
  'seat.revoked': 'Elvesztette a helyét',
  'seat.cancelled': 'Lekerült a várólistáról',
  'seat.requeued': 'Visszakerült a várólistára',
};

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '–';
  return map[key] ?? key;
}
