import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'E2eJelszo1';

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

export async function register(
  page: Page,
  user: { lastName: string; firstName: string; email: string },
  next?: string,
) {
  await page.goto(next ? `/register?next=${encodeURIComponent(next)}` : '/register');
  await page.getByLabel('Vezetéknév').fill(user.lastName);
  await page.getByLabel('Keresztnév').fill(user.firstName);
  await page.getByLabel('E-mail-cím').fill(user.email);
  await page.getByLabel('Jelszó').fill(PASSWORD);
  await page.getByRole('button', { name: 'Regisztráció' }).click();
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('E-mail-cím').fill(email);
  await page.getByLabel('Jelszó').fill(password);
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
}

export async function ownerWithCompany(page: Page, companyName: string) {
  const email = uniqueEmail('owner');
  await register(page, { lastName: 'Teszt', firstName: 'Tulajdonos', email });
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/dashboard/companies/new');
  await page.getByLabel('Cégnév').fill(companyName);
  await page.getByRole('button', { name: 'Létrehozás' }).click();
  await expect(page).toHaveURL(/\/dashboard\/companies\/[0-9a-f-]{36}$/);
  return { email, companyUrl: new URL(page.url()).pathname };
}
