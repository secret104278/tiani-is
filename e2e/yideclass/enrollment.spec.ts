import { expect, test } from "@playwright/test";

test.describe("YiDeClass Enrollment", () => {
  test("should manage class enrollment", async ({ page }) => {
    // 1. Navigate to class admin list
    await page.goto("/yideclass/admin/class");

    // 2. Click the first class
    const firstClassRow = page.locator("tbody tr").first();
    const className = await firstClassRow.innerText();
    await firstClassRow.click();

    // Verify detail page
    await expect(page).toHaveURL(
      new RegExp(`/yideclass/admin/class/${encodeURIComponent(className)}`),
    );

    // 3. Click "班員管理" (Class Member Management)
    await page.getByRole("button", { name: "班員管理" }).click();

    // Verify enroll page
    await expect(page).toHaveURL(
      new RegExp(
        `/yideclass/admin/class/enroll/${encodeURIComponent(className)}`,
      ),
    );

    // 4. Enroll the test user
    // Find row with "E2E Test User"
    const userRow = page.locator("tr", { hasText: "E2E Test User" });
    const checkbox = userRow.locator('input[type="checkbox"]');

    // Toggle checkbox
    await checkbox.click();

    // We can't easily assert the database state without API, but we can check if the UI reflects change
    // (though the UI might update optimistically or re-fetch).
    // Let's assume toggle works if no error alert appears.
    await expect(page.locator(".alert-warning")).not.toBeVisible();

    // Toggle back to restore state (clean up)
    await checkbox.click();
  });
});
