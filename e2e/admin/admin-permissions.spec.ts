import { expect, test } from "@playwright/test";
import { Role } from "@prisma/client";
import { loginAs } from "../utils/auth-helpers";

test.describe("Admin Permissions", () => {
  test("should not show admin settings to non-admin user", async ({
    page,
    context,
  }) => {
    // Login as user with NO roles
    await loginAs(context, []);

    // Navigate to home page
    await page.goto("/");

    // Open user menu
    await page.locator(".avatar.btn").click();

    // Verify "帳號管理" is NOT visible
    await expect(page.getByText("帳號管理")).not.toBeVisible();

    // Attempt direct access
    await page.goto("/admin/users");

    // The page loads, but the data should be protected.
    // We expect the admin user table to NOT be visible.
    await expect(page.getByRole("table")).not.toBeVisible();
  });

  test("should show admin settings to admin user", async ({
    page,
    context,
  }) => {
    // Login as TIANI_ADMIN
    await loginAs(context, [Role.TIANI_ADMIN]);

    // Navigate to home page
    await page.goto("/");

    // Open user menu
    await page.locator(".avatar.btn").click();

    // Verify "帳號管理" IS visible
    await expect(page.getByText("帳號管理")).toBeVisible();

    // Click it and verify navigation
    await page.getByText("帳號管理").click();
    await expect(page).toHaveURL(/\/admin\/users/);

    // Verify table is visible and no error
    await expect(page.getByText("只有管理員可以進行此操作")).not.toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});
