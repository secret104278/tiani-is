import { expect, test } from "../fixtures";

test.describe("Etogether Admin Stats", () => {
  test("should display stats page for admin", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/etogether");

    // Check if "活動統計" button is visible
    const statsBtn = page.getByRole("link", { name: "活動統計" });
    await expect(statsBtn).toBeVisible();

    await statsBtn.click();

    await expect(page).toHaveURL("/etogether/admin/stats");
    await expect(
      page.getByRole("heading", { name: "活動統計分析" }),
    ).toBeVisible();

    // Check if summary cards are visible
    await expect(page.getByText("年度總報名")).toBeVisible();
    await expect(page.getByText("年度實際出席")).toBeVisible();
    await expect(page.getByText("平均出席率")).toBeVisible();

    // Check year selector
    const yearSelector = page.getByRole("combobox");
    await expect(yearSelector).toBeVisible();
    await expect(yearSelector).toHaveValue(
      (new Date().getFullYear() - 1).toString(),
    );
  });

  test("should hide stats button for non-admin", async ({
    page,
    loginAsUser,
  }) => {
    await page.goto("/etogether");
    await expect(page.getByRole("link", { name: "活動統計" })).toBeHidden();

    await page.goto("/etogether/admin/stats");
    await expect(page.getByText("您沒有管理權限")).toBeVisible();
  });
});
