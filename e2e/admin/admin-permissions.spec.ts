import { expect, test } from "../fixtures";

test.describe("Admin Permissions", () => {
  test("should not show admin settings to non-admin user", async ({
    page,
    loginAsUser,
  }) => {
    await page.goto("/");

    await page.locator(".avatar.btn").click();

    await expect(page.getByText("帳號管理")).not.toBeVisible();

    await page.goto("/admin/users");

    await expect(page.getByRole("table")).not.toBeVisible();
  });

  test("should show admin settings to admin user", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/");

    await page.locator(".avatar.btn").click();

    await expect(page.getByText("帳號管理")).toBeVisible();

    await page.getByText("帳號管理").click();
    await expect(page).toHaveURL(/\/admin\/users/);

    await expect(page.getByText("只有管理員可以進行此操作")).not.toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});
