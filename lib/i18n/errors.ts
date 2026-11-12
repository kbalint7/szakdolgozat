const messages: Record<string, string> = {
  NOT_FOUND: 'Ez az elem már nem létezik.',
  FORBIDDEN: 'Ehhez a művelethez nincs jogosultságod.',
  CONFLICT: 'Az adatok időközben megváltoztak. Frissítsd az oldalt, és próbáld újra.',

  PRODUCT_SLUG_TAKEN: 'Ez az azonosító már foglalt.',
  PRODUCT_NOT_FOUND: 'Ez a termék már nem létezik.',
  PLAN_NOT_FOUND: 'Ez a csomag már nem létezik.',
  PLAN_INACTIVE: 'Ez a csomag most nem vásárolható meg.',

  COMPANY_NOT_FOUND: 'Ez a cég nem létezik, vagy nem férsz hozzá.',
  OWNER_CANNOT_LEAVE: 'Tulajdonosként nem léphetsz ki a cégből. Előbb add át a tulajdonjogot, vagy töröld a céget.',
  CANNOT_REMOVE_OWNER: 'A tulajdonost nem lehet eltávolítani.',
  CANNOT_REMOVE_ADMIN: 'Adminisztrátort csak a tulajdonos távolíthat el.',
  MEMBER_NOT_FOUND: 'Ez a tag már nincs a cégben.',
  ALREADY_OWNER: 'Ez a felhasználó már a tulajdonos.',
  CONFIRMATION_MISMATCH: 'A beírt név nem egyezik a cég nevével.',
  USER_OWNS_COMPANY:
    'Amíg egy cég tulajdonosa vagy, nem törölheted a fiókodat. Előbb add át a tulajdonjogot, vagy töröld a céget.',

  ALREADY_MEMBER: 'Ez a felhasználó már tagja a cégnek.',
  INVITATION_PENDING: 'Erre az e-mail-címre már van függő meghívó.',
  INVITATION_INVALID: 'A meghívó érvénytelen.',
  INVITATION_EXPIRED: 'A meghívó lejárt.',
  INVITATION_USED: 'Erre a meghívóra már válaszoltak.',
  INVITATION_REVOKED: 'A meghívót visszavonták.',
  INVITATION_EMAIL_MISMATCH: 'A meghívó másik e-mail-címre szól. Azzal a címmel jelentkezz be.',

  EMPLOYEE_NOT_FOUND: 'Ez a munkavállaló már nem létezik.',
  EMPLOYEE_ALREADY_LINKED: 'A munkavállaló már össze van kapcsolva egy másik taggal.',
  MEMBERSHIP_ALREADY_LINKED: 'Ez a tag már össze van kapcsolva egy másik munkavállalóval.',

  LICENSE_KEY_UNKNOWN: 'Nincs ilyen licenckulcs. Ellenőrizd, hogy jól írtad-e be.',
  LICENSE_KEY_USED: 'Ezt a licenckulcsot már aktiválták.',
  LICENSE_KEY_REVOKED: 'Ezt a licenckulcsot visszavonták.',
  LICENSE_NOT_FOUND: 'Ez a licenc már nem létezik.',

  RULE_EXISTS: 'Ilyen szabály már létezik.',
  RULE_NOT_FOUND: 'Ez a szabály már nem létezik.',

  API_KEY_NOT_FOUND: 'Ez az API-kulcs már nem létezik.',
  CLIENT_TOKEN_NOT_FOUND: 'Ez a klienstoken már nem létezik.',

  EVENT_NOT_FOUND: 'Ez az esemény már nem létezik.',
  EVENT_ID_CONFLICT: 'Ezzel az azonosítóval már érkezett egy eltérő tartalmú esemény.',
  EVENT_NOT_RETRYABLE: 'Csak sikertelen eseményt lehet újrapróbálni.',

  CAPACITY_INVARIANT_VIOLATED: 'Váratlan hiba történt. Próbáld újra, és ha akkor sem megy, szólj az üzemeltetőnek.',
};

export function errorMessage(code: string): string {
  return messages[code] ?? 'Váratlan hiba történt. Próbáld újra.';
}
