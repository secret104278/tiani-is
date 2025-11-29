// spec: 3. Role Management -> 3.1. should assign and revoke roles
// seed: e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Role Management', () => {
  test('should assign and revoke roles', async ({ page }) => {
    // Navigate to admin users page
    await page.goto('/admin/users');

    // 1. Identify a target user (e.g., "Test User B")
    // Create a new user to ensure clean state
    const uniqueUserName = `Test User Role ${Date.now()}`;
    await page.getByRole('button', { name: '新增帳號' }).click();
    await page.getByRole('textbox').fill(uniqueUserName);
    await page.getByRole('button', { name: '建立' }).click();

    // Locate the user row
    const userRow = page.getByRole('row', { name: uniqueUserName });
    
    // The "Tiani Volunteer Admin" checkbox is the second checkbox in the row
    // (First is Super Admin, Second is Tiani Volunteer Admin)
    const tianiAdminCheckbox = userRow.getByRole('checkbox').nth(1);

    // 2. Click "Tiani Volunteer Admin" checkbox to assign role
    await tianiAdminCheckbox.click();

    // 3. Verify checkbox is checked
    await expect(tianiAdminCheckbox).toBeChecked();

    // 4. Reload page
    await page.reload();

    // 5. Verify checkbox remains checked
    await expect(tianiAdminCheckbox).toBeChecked();

    // 6. Click checkbox again to revoke role
    await tianiAdminCheckbox.click();

    // 7. Verify checkbox is unchecked
    await expect(tianiAdminCheckbox).not.toBeChecked();
  });
});
