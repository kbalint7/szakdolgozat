import { expect, test } from '@playwright/test';

import { ownerWithCompany } from './helpers';

test('UC-02/04/06/07: buy and activate a plan, create a rule, a hire gets a seat', async ({ page }) => {
  const { companyUrl } = await ownerWithCompany(page, 'E2E Kft.');

  await page.goto('/products/ide-pro');
  await page.locator('li', { hasText: 'Csapat' }).getByRole('link', { name: 'Vásárlás' }).click();
  await expect(page.getByRole('heading', { name: 'Vásárlás' })).toBeVisible();
  await page.getByRole('button', { name: 'Vásárlás megerősítése' }).click();
  await expect(page.getByText('Aktiváltuk a licencet, amely 5 helyre szól.')).toBeVisible();

  await page.goto(`${companyUrl}/rules`);
  await page.getByLabel('Munkakör').fill('developer');
  await page.getByLabel('Szoftver').selectOption({ label: 'IDE Pro' });
  await page.getByRole('button', { name: 'Szabály létrehozása' }).click();
  await expect(page.getByRole('cell', { name: 'developer', exact: true })).toBeVisible();

  await page.goto(`${companyUrl}/employees`);
  await page.getByRole('button', { name: 'Esemény rögzítése' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('HR-azonosító').fill('E-9001');
  await dialog.getByLabel('Munkakör').fill('developer');
  await dialog.getByLabel('Név').fill('Új Fejlesztő');
  await dialog.getByRole('button', { name: 'Rögzítés' }).click();
  await expect(page.getByText('Az eseményt feldolgoztuk, és frissítettük a helyeket.')).toBeVisible();

  const row = page.getByRole('row', { name: /E-9001/ });
  await expect(row.getByText('IDE Pro')).toBeVisible();

  await page.goto(`${companyUrl}/licenses`);
  const pool = page.getByRole('row', { name: /IDE Pro/ }).first();
  await expect(pool.getByRole('cell').nth(1)).toContainText('1 / 5 hely');

  await page.goto(`${companyUrl}/employees`);
  await page.getByRole('link', { name: 'Új Fejlesztő' }).click();
  const granted = page.getByRole('listitem').filter({ hasText: /^IDE Pro: helyet kapott/ });
  await expect(granted.getByText('a munkaköréhez jár')).toBeVisible();

  await page.getByRole('button', { name: 'Esemény rögzítése' }).click();
  const change = page.getByRole('dialog');
  await expect(change.getByLabel('Esemény', { exact: true })).toHaveValue('employee.role_changed');
  const later = new Date(Date.now() + 60_000);
  const localLater = new Date(later.getTime() - later.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  await change.getByLabel('Időpont').fill(localLater);
  await change.getByLabel('Munkakör').fill('tester');
  await change.getByRole('button', { name: 'Rögzítés' }).click();
  await expect(page.getByText('Az eseményt feldolgoztuk, és frissítettük a helyeket.')).toBeVisible();
  await expect(change).toBeHidden();
  await expect(page.getByText('tester', { exact: true }).first()).toBeVisible();
});

test('KEY-1: an API key is shown once and can be revoked', async ({ page }) => {
  const { companyUrl } = await ownerWithCompany(page, 'Kulcs Kft.');
  await page.goto(`${companyUrl}/api-keys`);
  await page.getByLabel('Név').fill('HR rendszer');
  await page.getByRole('button', { name: 'Kulcs létrehozása' }).click();
  const secret = page.locator('code', { hasText: /^lm_live_[0-9a-f]{8}_/ });
  await expect(secret).toBeVisible();
  const token = await secret.textContent();

  await page.reload();
  await expect(page.getByText(token!)).toHaveCount(0);
  const row = page.getByRole('row', { name: /HR rendszer/ });
  await expect(row.getByText('Aktív')).toBeVisible();

  await row.getByRole('button', { name: 'Visszavonás' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Visszavonás' }).click();
  await expect(row.getByText('Visszavonva')).toBeVisible();
});
