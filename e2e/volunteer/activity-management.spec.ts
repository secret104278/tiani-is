import { expect, test } from "@playwright/test";

test.describe("Volunteer Activity Management", () => {
  test("should create a new volunteer activity", async ({ page }) => {
    await page.goto("/volunteer");

    // Click "Create New Activity" button
    await page.getByRole("link", { name: "建立新工作" }).click();

    await expect(page).toHaveURL("/volunteer/activity/new");

    // Fill the form
    // Select topic. Note: The select implementation might be complex, let's try standard select first or check implementation.
    // The SelectWithCustomInput uses a native select if simple.
    // Based on code: <select {...register("title")} ...>
    await page.locator('select[name="title"]').selectOption({ index: 1 }); // Select second option

    await page.fill('input[name="headcount"]', "5");
    await page.fill('input[name="location"]', "Test Location");

    // Set start time to local time (1 hour later)
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);

    await page.fill('input[name="duration"]', "2");
    await page.fill(
      'textarea[name="description"]',
      "This is a test activity description",
    );

    // Click Submit
    await page.getByRole("button", { name: "送出" }).click();

    // Verify redirection to detail page
    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

    // Verify content
    await expect(page.getByText("Test Location")).toBeVisible();
    await expect(
      page.getByText("This is a test activity description"),
    ).toBeVisible();
  });
});
