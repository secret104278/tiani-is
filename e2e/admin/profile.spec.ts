import { expect, test } from "../fixtures";

test.describe("4. Profile Management", () => {
  test("should update user profile Tao information", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto("/admin/users");
    await page
      .getByRole("row", { name: testUser.name || "Test User" })
      .first()
      .getByRole("button")
      .click();

    await page.locator('input[name="qiudaoDateSolar"]').fill("2023-01-01");

    await page.getByRole("combobox").selectOption("子時 (23:00-01:00)");

    await page.locator('input[name="qiudaoTemple"]').fill("Test Temple");
    await page.locator('input[name="qiudaoTanzhu"]').fill("Test Host");
    await page.locator('input[name="affiliation"]').fill("Test Unit");
    await page.locator('input[name="dianChuanShi"]').fill("Test Transmitter");
    await page.locator('input[name="yinShi"]').fill("Test Introducer");
    await page.locator('input[name="baoShi"]').fill("Test Guarantor");

    await page.getByRole("button", { name: "儲存" }).click();

    await page.reload();
    await page
      .getByRole("row", { name: testUser.name || "Test User" })
      .first()
      .getByRole("button")
      .click();

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
