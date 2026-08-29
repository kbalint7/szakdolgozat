const messages: Record<string, string> = {
  NOT_FOUND: 'A keresett elem nem található.',
  FORBIDDEN: 'Ehhez a művelethez nincs jogosultságod.',
  CONFLICT: 'Az adatok időközben megváltoztak. Frissítsd az oldalt, és próbáld újra.',

  PRODUCT_SLUG_TAKEN: 'Ez az azonosító (slug) már foglalt.',
  PRODUCT_NOT_FOUND: 'A termék nem található.',
  PLAN_NOT_FOUND: 'A csomag nem található.',
  PLAN_INACTIVE: 'Ez a csomag már nem vásárolható meg.',

  COMPANY_NOT_FOUND: 'A cég nem található.',
  OWNER_CANNOT_LEAVE: 'A tulajdonos nem léphet ki a cégből. Előbb add át a tulajdonjogot, vagy töröld a céget.',
  CANNOT_REMOVE_OWNER: 'A tulajdonost nem lehet eltávolítani.',
  CANNOT_REMOVE_ADMIN: 'Adminisztrátort csak a tulajdonos távolíthat el.',
  MEMBER_NOT_FOUND: 'A tag nem található.',
  ALREADY_OWNER: 'Ez a felhasználó már a tulajdonos.',
  CONFIRMATION_MISMATCH: 'A megerősítő szöveg nem egyezik a cég nevével.',
  USER_OWNS_COMPANY: 'Amíg céged tulajdonosa vagy, a fiókod nem törölhető. Előbb add át a tulajdonjogot.',

  ALREADY_MEMBER: 'Ez a felhasználó már tagja a cégnek.',
  INVITATION_PENDING: 'Erre az e-mail-címre már van függő meghívó.',
  INVITATION_INVALID: 'A meghívó érvénytelen.',
  INVITATION_EXPIRED: 'A meghívó lejárt.',
  INVITATION_USED: 'A meghívót már felhasználták.',
  INVITATION_REVOKED: 'A meghívót visszavonták.',
  INVITATION_EMAIL_MISMATCH: 'A meghívó másik e-mail-címre szól. Jelentkezz be azzal a fiókkal.',

  EMPLOYEE_NOT_FOUND: 'A munkavállaló nem található.',
  EMPLOYEE_ALREADY_LINKED: 'A munkavállaló már egy másik taghoz van kapcsolva.',
  MEMBERSHIP_ALREADY_LINKED: 'Ez a tag már egy másik munkavállalóhoz van kapcsolva.',

  LICENSE_KEY_UNKNOWN: 'Ismeretlen licenckulcs.',
  LICENSE_KEY_USED: 'Ezt a licenckulcsot már aktiválták.',
  LICENSE_KEY_REVOKED: 'Ezt a licenckulcsot visszavonták.',
  LICENSE_NOT_FOUND: 'A licenc nem található.',

  RULE_EXISTS: 'Ilyen szabály már létezik.',
  RULE_NOT_FOUND: 'A szabály nem található.',

  CAPACITY_INVARIANT_VIOLATED: 'Belső hiba: több helyet osztanánk ki, mint amennyi van.',
};

export function errorMessage(code: string): string {
  return messages[code] ?? 'Váratlan hiba történt.';
}
