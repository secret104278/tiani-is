import { type Page, expect, test } from "@playwright/test";

test.describe("Volunteer Stats", () => {
  async function createActivity(page: Page, offsetHours = 1) {
    await page.goto("/volunteer/activity/new");
    const select = page.locator('select[name="title"]');
    await select.selectOption({ index: 1 });
    const title = await select.evaluate(
      (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text,
    );

    if (!title) {
      throw new Error("Title should be selected");
    }

    await page.fill('input[name="headcount"]', "5");
    await page.fill('input[name="location"]', "Test Location");

    const now = new Date();
    now.setMinutes(now.getMinutes() + offsetHours * 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);

    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2");
    await page.fill('textarea[name="description"]', "Description");

    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);
    return { id: page.url().split("/").pop(), title };
  }

  test("should display working stats", async ({ page }) => {
    // 1. Setup data: Perform a casual check-in/check-out cycle to ensure we have at least one record
    await page.goto("/volunteer");

    // Find the Casual Check-in Card
    const card = page.locator(".card", { hasText: "日常工作" });
    await expect(card).toBeVisible();

    // Check current state
    const button = card.locator("button");
    // Ensure button is loaded
    await expect(button).toBeVisible();

    const buttonText = await button.innerText();

    // If not checked in (button says "簽到" or similar), check in first
    if (!buttonText.includes("簽退")) {
      await button.click();
      // Handle dialog
      await expect(
        page.getByRole("heading", { name: "定位打卡" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "打卡", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(button).toContainText("簽退");
    }

    // Now check out to complete the record
    await button.click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 2. Setup Activity data: Create and complete an activity check-in
    const { id: activityId, title: activityTitle } = await createActivity(
      page,
      0,
    ); // Starts now
    await page.goto(`/volunteer/activity/detail/${activityId}`);

    // Register
    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    // Check-in
    const checkInBtn = page.getByRole("button", { name: "簽到" });
    await expect(checkInBtn).toBeEnabled();
    await checkInBtn.click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // Check-out
    const checkOutBtn = page.getByRole("button", { name: "簽退" });
    await expect(checkOutBtn).toBeVisible();
    await checkOutBtn.click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 3. Go to stats page
    await page.goto("/volunteer");
    // Verify the link is present
    await expect(
      page.locator('a[href="/volunteer/workingstats"]'),
    ).toBeVisible();
    // Navigate directly to avoid potential overlay interception (e.g. from the map dialog on mobile)
    await page.goto("/volunteer/workingstats");

    // 4. Verify presence of key elements
    // Heading
    await expect(
      page.getByRole("heading", { level: 1, name: "打卡紀錄" }),
    ).toBeVisible();

    // Verify tabs exist
    await expect(page.locator(".tab", { hasText: "全部" })).toBeVisible();
    await expect(page.locator(".tab", { hasText: "主題工作" })).toBeVisible();
    await expect(page.locator(".tab", { hasText: "日常工作" })).toBeVisible();

    // 5. Verify records

    // Check "全部" tab contains both
    await expect(page.locator("table:visible")).toBeVisible();

    const allRows = page.locator("table:visible tbody tr");
    const count = await allRows.count();

    // We expect at least 2 rows in "All" tab (Casual + Activity)
    // Using .count() > 1 to allow for potential duplicates from retries, but ensuring we have our records.
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(page.locator("table:visible")).toContainText("日常工作");
    await expect(page.locator("table:visible")).toContainText(activityTitle);

    // Switch to "主題工作" tab
    await page.locator(".tab", { hasText: "主題工作" }).click();

    // Verify "日常工作" is NOT visible
    await expect(page.locator("table:visible")).not.toContainText("日常工作");
    // Verify activity is visible
    await expect(page.locator("table:visible")).toContainText(activityTitle);

    // Switch to "日常工作" tab
    await page.locator(".tab", { hasText: "日常工作" }).click();

    // Verify it exists (row count >= 1)
    await expect(page.locator("table:visible tbody tr").first()).toBeVisible();
    // Verify activity is NOT visible
    await expect(page.locator("table:visible")).not.toContainText(
      activityTitle,
    );
    // Note: "日常工作" text is NOT in this specific table, so we don't check for it.

    // Switch back to "全部"
    await page.locator(".tab", { hasText: "全部" }).click();
    await expect(page.locator("table:visible tbody tr").first()).toBeVisible();
  });
});
