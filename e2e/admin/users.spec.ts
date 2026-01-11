import { expect, test } from "../fixtures";

test.describe("Admin Users", () => {
  test("should display user list with card structure and filters", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: "權限管理" })).toBeVisible();

    // Check filters
    await expect(page.getByRole("button", { name: "全部" })).toBeVisible();
    await expect(page.getByRole("button", { name: "無權限" })).toBeVisible();

    // Check search input
    await expect(page.getByPlaceholder(/搜尋 .* 的人員.../)).toBeVisible();

    // Check sections
    // Default unit is "義德"
    await expect(page.getByRole("button", { name: "義德" })).toHaveClass(
      /bg-base-content/,
    );

    // Initial state might show "查無名單" or user cards
    const noResults = page.getByText("查無名單");
    const staffSection = page.getByText("權限管理人員");
    const regularSection = page.getByText("一般人員");

    await expect(noResults.or(staffSection).or(regularSection)).toBeVisible();

    await expect(page.getByRole("button", { name: "新增帳號" })).toBeVisible();
  });

  test("should filter users by unit and role", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/admin/users");

    // Test Unit Switching
    await page.getByRole("button", { name: "其他" }).click();
    await expect(page.getByRole("button", { name: "其他" })).toHaveClass(
      /bg-base-content/,
    );
    await expect(page.getByPlaceholder(/搜尋 其他 的人員.../)).toBeVisible();

    // Test Role Filtering
    await page.getByRole("button", { name: "最高" }).click();
    await expect(page.getByRole("button", { name: "最高" })).toHaveClass(
      /bg-primary/,
    );

    // Verify staff section header reflects filter
    await expect(page.getByText("最高管理人員")).toBeVisible();
  });
});
