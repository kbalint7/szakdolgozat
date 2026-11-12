import { expect, test } from '@playwright/test';

import { login, PASSWORD, register, uniqueEmail } from './helpers';

test.describe('AUTH-1 … AUTH-3', () => {
  test('protected routes redirect to the login page', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fprofile/);
    await expect(page.getByRole('button', { name: 'Bejelentkezés' })).toBeVisible();
  });

  test('registration validates the password policy in Hungarian, then signs in', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Vezetéknév').fill('Kiss');
    await page.getByLabel('Keresztnév').fill('Anna');
    await page.getByLabel('E-mail-cím').fill(uniqueEmail('anna'));
    await page.getByLabel('Jelszó').fill('gyenge');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    const unmet = page.locator('[data-state="unmet"]');
    await expect(unmet.filter({ hasText: '8–128 karakter' })).toBeVisible();
    await expect(unmet.filter({ hasText: 'nagybetű' })).toBeVisible();
    await expect(unmet.filter({ hasText: 'számjegy' })).toBeVisible();
    await expect(unmet.filter({ hasText: 'kisbetű' })).toHaveCount(0);

    await page.getByLabel('Jelszó').fill(PASSWORD);
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Üdv, Kiss Anna!' })).toBeVisible();
  });

  test('a duplicate email is rejected and a wrong password gives one generic error', async ({ page }) => {
    const email = uniqueEmail('dup');
    await register(page, { lastName: 'Első', firstName: 'Fiók', email });
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.context().clearCookies();

    await register(page, { lastName: 'Második', firstName: 'Fiók', email });
    await expect(page.getByText('Ezzel az e-mail-címmel már regisztráltak.')).toBeVisible();

    await login(page, email, 'RosszJelszo1');
    await expect(page.getByText('Hibás e-mail-cím vagy jelszó.')).toBeVisible();
    await login(page, 'nincs.ilyen@e2e.test', 'RosszJelszo1');
    await expect(page.getByText('Hibás e-mail-cím vagy jelszó.')).toBeVisible();
  });
});
