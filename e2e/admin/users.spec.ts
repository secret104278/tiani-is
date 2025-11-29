import { expect, test } from "@playwright/test";

test.describe("Admin Users", () => {
  test("should display user list", async ({ page }) => {
    await page.goto("/admin/users");

    // Verify page title
    await expect(page.getByRole("heading", { name: "帳號管理" })).toBeVisible();

    // Verify table columns
    const headers = [
      "姓名",
      "最高 管理者",
      "天一志工隊 管理者",
      "義德班務網 管理者",
      "義德道務網 管理者",
      "活動e起來 管理者",
      "個人資料",
    ];
    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", { name: header }),
      ).toBeVisible();
    }

    // Verify "E2E Test User" is present in the table
    // It might be paginated or sorted, but with few users it should be visible.
    // The name cell is in the first column (tiani-table-pin-col).
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);

    // Check if our test user is there
    // The name is truncated in the table cell (e.g. "E2E..."), so we use a partial match.
    // This matches any element containing "E2E" within the table.
    await expect(
      page.locator("table").getByText("E2E", { exact: false }).first(),
    ).toBeVisible();

    // Verify "新增帳號" button
    await expect(page.getByRole("button", { name: "新增帳號" })).toBeVisible();
  });
});
