import { test, expect } from '@playwright/test';

test.describe('User Creation', () => {
  test('should create a new offline user', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('/admin/users');

    // 1. Click "新增帳號" button
    await page.getByRole('button', { name: '新增帳號' }).click();

    // 2. Verify warning message about offline usage
    await expect(page.getByText('新增帳號僅限用於道親沒有 Line 帳號也沒有使用 3C 產品，且短期內也不會嘗試使用。')).toBeVisible();

    // 3. Enter name "Test User B"
    await page.getByRole('textbox').fill('Test User B');

    // 4. Click "建立" (Create)
    await page.getByRole('button', { name: '建立' }).click();

    // 5. Verify "Test User B" is added to the list
    await expect(page.getByRole('cell', { name: 'Test User B' }).first()).toBeVisible();
  });
});
