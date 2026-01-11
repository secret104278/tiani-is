import { expect, test } from "../fixtures";

test.describe("Role Management", () => {
  test("should assign and revoke roles via Careful UI dialog", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/admin/users");

    const uniqueUserName = `Test User Role ${Date.now()}`;
    // Create user
    await page.getByRole("button", { name: "新增帳號" }).click();
    await page.getByRole("textbox").fill(uniqueUserName);
    await page.getByRole("button", { name: "建立" }).click();

    // Find the user and open editor
    await page.getByPlaceholder(/搜尋 .* 的人員.../).fill(uniqueUserName);

    // If no user found in current unit, try "其他"
    if (await page.getByText("查無名單").isVisible()) {
      await page.getByRole("button", { name: "其他" }).click();
    }

    // Open Permission Editor
    const newUserRow = page
      .locator("section")
      .filter({ hasText: /一般人員/ })
      .locator("div")
      .filter({ hasText: uniqueUserName })
      .first();
    await newUserRow.locator("button").last().click();

    await expect(page.getByText("人員權限設定")).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "人員權限設定" });
    await expect(dialog.getByText(uniqueUserName)).toBeVisible();

    const volunteerAdminToggle = dialog
      .locator("div")
      .filter({ hasText: /^志工隊管理者$/ })
      .getByRole("checkbox");

    // Assign Role
    await volunteerAdminToggle.click();
    await expect(volunteerAdminToggle).toBeChecked();

    await page.getByRole("button", { name: "關閉" }).click();

    // Should now be in Staff Section
    await expect(page.getByText("權限管理人員")).toBeVisible();
    const userCard = page.locator(".card", { hasText: uniqueUserName });
    await expect(userCard).toBeVisible();
    await expect(userCard.getByText("志工")).toBeVisible();

    // Revoke Role
    const staffSection = page
      .locator("section")
      .filter({ hasText: /權限管理人員/ });
    const userCardOnStaff = staffSection.locator(".card", {
      hasText: uniqueUserName,
    });
    await userCardOnStaff.locator("button").last().click();
    await volunteerAdminToggle.click();
    await expect(volunteerAdminToggle).not.toBeChecked();
    await page.getByRole("button", { name: "關閉" }).click();

    await expect(userCard).not.toBeVisible();
  });

  test("should enforce permission constraints (cannot disable self-admin)", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/admin/users");

    // 切換到「其他」過濾器以確保能看到預設單位的管理者
    await page.getByRole("button", { name: "其他" }).click();

    // 動態搜尋當前登入使用者的名稱
    await page
      .getByPlaceholder(/搜尋 .* 的人員.../)
      .fill(loginAsAdmin.name || "");

    // Admin 一定會在「權限管理人員」區塊
    const staffSection = page
      .locator("section")
      .filter({ hasText: /權限管理人員/ });
    const adminCard = staffSection.locator(".card").first();

    // 點擊權限設定按鈕 (AdjustmentsHorizontalIcon)
    await adminCard.locator("button").last().click();

    const tianiAdminToggle = page
      .getByRole("dialog", { name: "人員權限設定" })
      .locator("div")
      .filter({ hasText: /^最高管理者$/ })
      .getByRole("checkbox");

    // 應該被禁用且選中（不可取消自己）
    await expect(tianiAdminToggle).toBeDisabled();
    await expect(tianiAdminToggle).toBeChecked();

    // 當擁有最高管理者權限時，其他權限應該也是 disabled（符合程式碼邏輯）
    const volunteerAdminToggle = page
      .getByRole("dialog", { name: "人員權限設定" })
      .locator("div")
      .filter({ hasText: /^志工隊管理者$/ })
      .getByRole("checkbox");
    await expect(volunteerAdminToggle).toBeDisabled();
  });
});
