import { expect, test } from "@playwright/test";
import {
  createActivity,
  ensureCasualCheckOut,
  performActivityCheckIn,
  performActivityCheckOut,
  performCasualCheckIn,
  performCasualCheckOut,
} from "../utils/volunteer-helpers";

test.describe("Volunteer Stats", () => {
  test("should display working stats", async ({ page }) => {
    await page.goto("/volunteer");

    await ensureCasualCheckOut(page);

    await performCasualCheckIn(page);

    await performCasualCheckOut(page);

    const { id: activityId, title: activityTitle } = await createActivity(
      page,
      { offsetHours: 0 },
    );

    await page.goto(`/volunteer/activity/detail/${activityId}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    await performActivityCheckIn(page);

    await performActivityCheckOut(page);

    await page.goto("/volunteer");
    await expect(
      page.locator('a[href="/volunteer/workingstats"]'),
    ).toBeVisible();
    await page.goto("/volunteer/workingstats");

    await expect(
      page.getByRole("heading", { level: 1, name: "打卡紀錄" }),
    ).toBeVisible();

    await expect(page.locator(".tab", { hasText: "全部" })).toBeVisible();
    await expect(page.locator(".tab", { hasText: "主題工作" })).toBeVisible();
    await expect(page.locator(".tab", { hasText: "日常工作" })).toBeVisible();

    await expect(page.locator("table:visible")).toBeVisible();

    const allRows = page.locator("table:visible tbody tr");
    const count = await allRows.count();

    expect(count).toBeGreaterThanOrEqual(2);
    await expect(page.locator("table:visible")).toContainText("日常工作");
    await expect(page.locator("table:visible")).toContainText(activityTitle);

    await page.locator(".tab", { hasText: "主題工作" }).click();

    await expect(page.locator("table:visible")).not.toContainText("日常工作");
    await expect(page.locator("table:visible")).toContainText(activityTitle);

    await page.locator(".tab", { hasText: "日常工作" }).click();

    await expect(page.locator("table:visible tbody tr").first()).toBeVisible();
    await expect(page.locator("table:visible")).not.toContainText(
      activityTitle,
    );

    await page.locator(".tab", { hasText: "全部" }).click();
    await expect(page.locator("table:visible tbody tr").first()).toBeVisible();
  });
});
