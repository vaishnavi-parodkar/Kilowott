import { test, expect } from '@playwright/test';

test('add a product and see it in the catalog', async ({ page }) => {
  await page.goto('/products');

  // Wait for the sample catalog to finish loading.
  await expect(page.getByText('AeroBook Pro 14')).toBeVisible();

  await page.getByRole('button', { name: 'Add product' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add product' });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Product name').fill('E2E Test Keyboard');
  await dialog.getByLabel('SKU').fill('KEY-E2E-001');
  await dialog.getByLabel('Category').fill('Accessories');
  await dialog.getByLabel('Price (USD)').fill('59.90');
  await dialog.getByLabel('Stock').fill('25');
  await dialog.getByLabel('Status').selectOption('published');

  // Add one dynamic attribute
  await dialog.getByRole('button', { name: 'Add attribute' }).click();
  await dialog.getByLabel('Attribute 1 name').fill('Color');
  await dialog.getByLabel('Attribute 1 value').fill('Black');

  await dialog.getByRole('button', { name: 'Save product' }).click();

  // Dialog closes and the product shows up in the catalog table.
  await expect(dialog).toBeHidden();
  const row = page.getByTestId('product-row').filter({ hasText: 'E2E Test Keyboard' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('KEY-E2E-001');
  await expect(row).toContainText('Accessories');
  await expect(row).toContainText('$59.90');
  await expect(row).toContainText('Pending');

  // Data persists in localStorage across a reload.
  await page.reload();
  await expect(page.getByTestId('product-row').filter({ hasText: 'E2E Test Keyboard' })).toBeVisible();
});
