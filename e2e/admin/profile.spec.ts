// spec: specs/plan.md
// seed: e2e/seed.spec.ts

import { expect, test } from "@playwright/test";

test.describe("4. Profile Management", () => {
  test("should update user profile Tao information", async ({ page }) => {
    // 1. Click "Profile" (個人資料) button for a user
    await page.goto("/admin/users");
    await page
      .getByRole("row", { name: "E2E Test User" })
      .getByRole("button")
      .click();

    // 2. Fill in Tao Initiation Date (e.g., "2023-01-01")
    await page.locator('input[name="qiudaoDateSolar"]').fill("2023-01-01");

    // 3. Select Time (e.g., "子時")
    await page.getByRole("combobox").selectOption("子時 (23:00-01:00)");

    // 4. Fill in Temple, Host, Unit, Transmitter, Introducer, Guarantor
    await page.locator('input[name="qiudaoTemple"]').fill("Test Temple");
    await page.locator('input[name="qiudaoTanzhu"]').fill("Test Host");
    await page.locator('input[name="affiliation"]').fill("Test Unit");
    await page.locator('input[name="dianChuanShi"]').fill("Test Transmitter");
    await page.locator('input[name="yinShi"]').fill("Test Introducer");
    await page.locator('input[name="baoShi"]').fill("Test Guarantor");

    // 5. Click "儲存" (Save)
    await page.getByRole("button", { name: "儲存" }).click();

    // 6. Reload page and open profile again
    await page.reload();
    await page
      .getByRole("row", { name: "E2E Test User" })
      .getByRole("button")
      .click();

    // 7. Verify all fields match the entered values
    await expect(page.locator('input[name="qiudaoDateSolar"]')).toHaveValue(
      "2023-01-01",
    );
    await expect(page.getByRole("combobox")).toHaveValue("子");
    await expect(page.locator('input[name="qiudaoTemple"]')).toHaveValue(
      "Test Temple",
    );
    await expect(page.locator('input[name="qiudaoTanzhu"]')).toHaveValue(
      "Test Host",
    );
    await expect(page.locator('input[name="affiliation"]')).toHaveValue(
      "Test Unit",
    );
    await expect(page.locator('input[name="dianChuanShi"]')).toHaveValue(
      "Test Transmitter",
    );
    await expect(page.locator('input[name="yinShi"]')).toHaveValue(
      "Test Introducer",
    );
    await expect(page.locator('input[name="baoShi"]')).toHaveValue(
      "Test Guarantor",
    );
  });
});
