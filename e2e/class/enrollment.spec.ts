import { expect, test } from "../fixtures";

test.describe("YiDeClass Enrollment", () => {
  test("should manage class enrollment", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto("/class/admin/class");

    const firstClassRow = page.locator("tbody tr").first();
    const className = (await firstClassRow.innerText()).trim();
    await firstClassRow.click();

    await expect(page).toHaveURL(
      new RegExp(`/class/admin/class/${encodeURIComponent(className)}`),
    );

    await page.getByRole("button", { name: "班員管理" }).click();

    // Verify we are on the enroll page
    await expect(
      page.getByRole("heading", { name: /班員管理$/ }),
    ).toBeVisible();

    // Find the test user row and toggle enrollment
    const userRow = page.getByRole("row", { name: testUser.name! });
    const checkbox = userRow.getByRole("checkbox");

    const isChecked = await checkbox.isChecked();
    await checkbox.click();

    // Simple wait for network if needed or verify state change
    if (isChecked) {
      await expect(checkbox).not.toBeChecked();
    } else {
      await expect(checkbox).toBeChecked();
    }

    await expect(page.locator(".alert-warning")).not.toBeVisible();
  });
});
