import { expect, test } from "@playwright/test";

test.describe("Etogether Activity Flow", () => {
  test("should create activity and register", async ({ page }) => {
    // 1. Create Activity
    await page.goto("/etogether");
    await page.getByRole("link", { name: "建立新活動" }).click();

    // Fill Form
    await page.fill('input[name="title"]', "Test Etogether Activity");
    await page.fill('input[name="location"]', "Test Location");

    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2");

    // Add Subgroup
    await page.getByRole("button", { name: "新增分組" }).click();
    await page.fill('input[name="subgroups.0.title"]', "Group A");
    await page.fill(
      'textarea[name="subgroups.0.description"]',
      "Description for Group A",
    );

    await page.fill('textarea[name="description"]', "Main description");

    // Submit
    await page.getByRole("button", { name: "送出" }).click();

    // 2. Verify Detail Page
    await expect(page).toHaveURL(/\/etogether\/activity\/detail\/\d+/);
    // Use role heading to be specific
    await expect(
      page.getByRole("heading", { name: "Test Etogether Activity" }),
    ).toBeVisible();

    // 3. Register
    // Force click because the button might be animating or partially covered?
    // Or just click normally.
    await page.getByRole("button", { name: "報名", exact: true }).click();

    // The dialog has transition classes "transition duration-300 ease-out data-[closed]:opacity-0"
    // It might take a moment to become visible.
    // The snapshot shows the dialog is "active" but locator resolved to "hidden" <div ... data-[closed]:opacity-0 ...>
    // This suggests it's waiting for animation or state change.
    // Let's wait for the HEADING inside the dialog to be visible, which is more stable.
    await expect(
      page.getByRole("heading", { name: "Test Etogether Activity 報名" }),
    ).toBeVisible({ timeout: 10000 });

    // Select Subgroup (it should default to the only one or first one)
    // We can just verify it is selectable.
    await page
      .locator('select[name="subgroupId"]')
      .selectOption({ label: "Group A" });

    // Submit Registration
    await page.getByRole("button", { name: "送出報名" }).click();

    // The page reloads.
    await page.waitForLoadState("domcontentloaded");

    // 4. Verify Registration
    await expect(page.getByText("我的報名表")).toBeVisible();
    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
