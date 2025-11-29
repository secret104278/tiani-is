import { expect, test } from "@playwright/test";

test.describe("YiDeClass Management", () => {
  test("should create a new class activity", async ({ page }) => {
    await page.goto("/yideclass");

    // Click "Create New Check-in Sheet" (建立新簽到單)
    await page.getByRole("link", { name: "建立新簽到單" }).click();

    await expect(page).toHaveURL("/yideclass/activity/new");

    // Fill form
    // Title defaults to first option, let's select specific one or leave default.
    // Let's pick 2nd option for title and location to test selection.
    await page.locator('select[name="title"]').selectOption({ index: 0 }); // First option
    await page.locator('select[name="location"]').selectOption({ index: 0 }); // First option

    // Start time (local)
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);

    await page.fill('input[name="duration"]', "2.5");
    await page.fill('textarea[name="description"]', "Test Class Activity");

    // Submit
    await page.getByRole("button", { name: "送出" }).click();

    // Verify redirect
    await expect(page).toHaveURL(/\/yideclass\/activity\/detail\/\d+/);

    // Verify content
    await expect(page.getByText("Test Class Activity")).toBeVisible();
  });
});
