import { expect, test } from "@playwright/test";

test.describe("Etogether Activity Flow", () => {
  test("should create activity and register", async ({ page }) => {
    await page.goto("/etogether");
    await page.getByRole("link", { name: "建立新活動" }).click();

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

    await page.getByRole("button", { name: "新增分組" }).click();
    await page.fill('input[name="subgroups.0.title"]', "Group A");
    await page.fill(
      'textarea[name="subgroups.0.description"]',
      "Description for Group A",
    );

    await page.fill('textarea[name="description"]', "Main description");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/etogether\/activity\/detail\/\d+/);
    await expect(
      page.getByRole("heading", { name: "Test Etogether Activity" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "報名", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Test Etogether Activity 報名" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .locator('select[name="subgroupId"]')
      .selectOption({ label: "Group A" });

    await page.getByRole("button", { name: "送出報名" }).click();

    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("我的報名表")).toBeVisible();
    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
