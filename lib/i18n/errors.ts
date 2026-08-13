const messages: Record<string, string> = {
  NOT_FOUND: 'A keresett elem nem található.',
  FORBIDDEN: 'Ehhez a művelethez nincs jogosultságod.',
  CONFLICT: 'Az adatok időközben megváltoztak. Frissítsd az oldalt, és próbáld újra.',

  PRODUCT_SLUG_TAKEN: 'Ez az azonosító (slug) már foglalt.',
  PRODUCT_NOT_FOUND: 'A termék nem található.',
  PLAN_NOT_FOUND: 'A csomag nem található.',
  PLAN_INACTIVE: 'Ez a csomag már nem vásárolható meg.',
};

export function errorMessage(code: string): string {
  return messages[code] ?? 'Váratlan hiba történt.';
}
