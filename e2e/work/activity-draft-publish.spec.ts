import { expect, test } from "../fixtures";

test.describe("YideWork Activity Draft to Published", () => {
  test("Create a draft and publish it via Edit", async ({ loginAsWorkAdmin, page }) => {
    const uniqueTitle = `Draft Activity ${Date.now()}`;
    
    await page.goto("/work/yide");

    // 1. Create a draft
    await page.getByRole("link", { name: "建立新通知" }).click();
    await page.locator('select[name="title"]').selectOption("獻供通知");
    await page.locator('select[name="offeringFestival"]').selectOption("初一");
    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill("2026-03-06T10:00");
    await page.locator('textarea[name="description"]').fill(uniqueTitle);
    
    await page.getByRole("button", { name: "保存草稿" }).click();

    // Verify it's a draft
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByText("草稿")).toBeVisible();

    // 2. Edit and Publish
    await page.getByRole("link", { name: "編輯" }).click();
    await expect(page.getByRole("heading", { name: "獻供通知" })).toBeVisible();
    
    // Change something
    await page.locator('textarea[name="description"]').fill(`${uniqueTitle} - Published`);
    
    // Click "送出" to publish
    await page.getByRole("button", { name: "送出" }).click();

    // 3. Verify it is now published
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByText("草稿")).not.toBeVisible();
    await expect(page.getByText("已發佈")).toBeVisible();
    await expect(page.getByText(`${uniqueTitle} - Published`)).toBeVisible();
  });
});
