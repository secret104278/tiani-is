import { expect, test } from "@playwright/test";

test.describe("YiDeClass Enrollment", () => {
  test("should manage class enrollment", async ({ page }) => {
    await page.goto("/yideclass/admin/class");

    const firstClassRow = page.locator("tbody tr").first();
    const className = await firstClassRow.innerText();
    await firstClassRow.click();

    await expect(page).toHaveURL(
      new RegExp(`/yideclass/admin/class/${encodeURIComponent(className)}`),
    );

    await page.getByRole("button", { name: "班員管理" }).click();

    await expect(page).toHaveURL(
      new RegExp(
        `/yideclass/admin/class/enroll/${encodeURIComponent(className)}`,
      ),
    );

    const userRow = page.locator("tr", { hasText: /E2E Test User/ }).first();
    const checkbox = userRow.locator('input[type="checkbox"]');

    await checkbox.click();

    await expect(page.locator(".alert-warning")).not.toBeVisible();

    await checkbox.click();
  });
});
