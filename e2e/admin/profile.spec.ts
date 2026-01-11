import { expect, test } from "../fixtures";

test.describe("4. Profile Management", () => {
  test("should update user profile Tao information", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto("/admin/users");

    // 1. Ensure user is visible (testUser usually has no affiliation)
    await page.getByRole("button", { name: "其他" }).click();
    await page.getByPlaceholder(/搜尋 .* 的人員.../).fill(testUser.name || "");

    const userCard = page.locator(
      ".card, .flex.items-center.justify-between.p-4",
      {
        hasText: testUser.name || "Test User",
      },
    );

    // 2. Open Profile Dialog
    const profileButton = userCard.getByRole("button", { name: "詳情" });
    await profileButton.click();

    // Use specific locator and rely on actionability (Playwright will wait for animation)
    const profileDialog = page.getByRole("dialog", { name: "個人資料" });

    await profileDialog
      .locator('input[name="qiudaoDateSolar"]')
      .fill("2023-01-01");

    // Verify lunar conversion display (Gap 4)
    // 2023-01-01 is 壬寅年 十二月初十 (or 臘月初十 depending on formatter)
    // Based on actual snapshot, it shows "十二月初十"
    await expect(profileDialog.getByText("壬寅年")).toBeVisible();
    await expect(profileDialog.getByText("十二月初十")).toBeVisible();

    await profileDialog
      .getByLabel("時辰")
      .selectOption("子時 (23:00-01:00)");

    await profileDialog
      .locator('input[name="qiudaoTemple"]')
      .fill("Test Temple");
    await profileDialog.locator('input[name="qiudaoTanzhu"]').fill("Test Host");
    const unitSelects = profileDialog.getByRole("combobox");
    await unitSelects.first().selectOption("Other");
    await profileDialog.getByPlaceholder("輸入完整單位名稱").fill("Test Unit");
    await profileDialog
      .locator('input[name="dianChuanShi"]')
      .fill("Test Transmitter");
    await profileDialog.locator('input[name="yinShi"]').fill("Test Introducer");
    await profileDialog.locator('input[name="baoShi"]').fill("Test Guarantor");

    await profileDialog.getByRole("button", { name: "儲存設定" }).click();

    // Ensure dialog is closed before reload
    await expect(profileDialog).toBeHidden();

    // Add a small delay or verify something to ensure DB is updated
    await page.waitForTimeout(1000);

    await page.reload();
    await page.getByRole("button", { name: "其他" }).click();
    await page.getByPlaceholder(/搜尋 .* 的人員.../).fill(testUser.name || "");

    const reUserCard = page.locator(
      ".card, .flex.items-center.justify-between.p-4",
      {
        hasText: testUser.name || "Test User",
      },
    );

    await reUserCard.getByRole("button", { name: "詳情" }).click();

    await expect(
      profileDialog.locator('input[name="qiudaoDateSolar"]'),
    ).toHaveValue("2023-01-01");
    await expect(profileDialog.getByLabel("時辰")).toHaveValue("子");
    await expect(
      profileDialog.locator('input[name="qiudaoTemple"]'),
    ).toHaveValue("Test Temple");
    await expect(
      profileDialog.locator('input[name="qiudaoTanzhu"]'),
    ).toHaveValue("Test Host");
    await expect(profileDialog.getByRole("combobox").first()).toHaveValue("Other");
    await expect(profileDialog.getByPlaceholder("輸入完整單位名稱")).toHaveValue(
      "Test Unit",
    );
    await expect(
      profileDialog.locator('input[name="dianChuanShi"]'),
    ).toHaveValue("Test Transmitter");
    await expect(profileDialog.locator('input[name="yinShi"]')).toHaveValue(
      "Test Introducer",
    );
    await expect(profileDialog.locator('input[name="baoShi"]')).toHaveValue(
      "Test Guarantor",
    );
  });
});
