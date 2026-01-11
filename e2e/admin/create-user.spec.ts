import { expect, test } from "../fixtures";

test.describe("User Creation", () => {
  test("should create a new offline user", async ({ page, loginAsAdmin }) => {
    await page.goto("/admin/users");

    const uniqueUserName = `Test User B ${Date.now()}`;

    await page.getByRole("button", { name: "新增帳號" }).click();

    await expect(
      page.getByText(
        "新增帳號僅限用於道親沒有 Line 帳號也沒有使用 3C 產品，且短期內也不會嘗試使用。",
      ),
    ).toBeVisible();

    await page.getByRole("textbox").fill(uniqueUserName);

    await page.getByRole("button", { name: "建立" }).click();

    // Switch to "Other" unit as new users default to no affiliation
    await page.getByRole("button", { name: "其他" }).click();

    await expect(page.getByText(uniqueUserName).first()).toBeVisible();
  });
});
