import { expect, test } from "../fixtures";

test.describe("Role Management", () => {
  test("should assign and revoke roles", async ({ page, loginAsAdmin }) => {
    await page.goto("/admin/users");

    const uniqueUserName = `Test User Role ${Date.now()}`;
    await page.getByRole("button", { name: "新增帳號" }).click();
    await page.getByRole("textbox").fill(uniqueUserName);
    await page.getByRole("button", { name: "建立" }).click();

    const userRow = page.getByRole("row", { name: uniqueUserName });

    const tianiAdminCheckbox = userRow.getByRole("checkbox").nth(1);

    await tianiAdminCheckbox.click();

    await expect(tianiAdminCheckbox).toBeChecked();

    await page.reload();

    await expect(tianiAdminCheckbox).toBeChecked();

    await tianiAdminCheckbox.click();

    await expect(tianiAdminCheckbox).not.toBeChecked();
  });
});
