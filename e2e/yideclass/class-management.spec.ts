import { expect, test } from "../fixtures";

test.describe("YiDeClass Management", () => {
  test("should create a new class activity", async ({ page, loginAsAdmin }) => {
    await page.goto("/yideclass");
    await page.getByRole("link", { name: "建立新簽到單" }).click();

    await expect(page).toHaveURL("/yideclass/activity/new");

    // Fill form
    await page.locator('select[name="title"]').selectOption({ index: 0 });
    await page.locator('select[name="location"]').selectOption({ index: 0 });

    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const dateString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2.5");
    await page.fill('textarea[name="description"]', "E2E Test Class Activity");

    await page.getByRole("button", { name: "送出" }).click();

    // Verify
    await expect(page).toHaveURL(/\/yideclass\/activity\/detail\/\d+/);
    await expect(page.getByText("E2E Test Class Activity")).toBeVisible();
  });
});
