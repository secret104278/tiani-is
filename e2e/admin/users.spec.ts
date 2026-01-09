import { expect, test } from "../fixtures";

test.describe("Admin Users", () => {
  test("should display user list", async ({ page, loginAsAdmin, testUser }) => {
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: "帳號管理" })).toBeVisible();

    const headers = [
      "姓名",
      "最高 管理者",
      "天一志工隊 管理者",
      "班務網 管理者",
      "道務網 管理者",
      "活動e起來 管理者",
      "個人資料",
    ];
    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", { name: header }),
      ).toBeVisible();
    }

    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);

    await expect(
      page.locator("table").getByText("Tes...", { exact: false }).first(),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "新增帳號" })).toBeVisible();
  });
});
