import { expect, test } from "../fixtures";

test.describe("YiDeClass Management", () => {
  test("should create a new class activity", async ({ page, loginAsAdmin }) => {
    await page.goto("/class");
    await page.getByRole("link", { name: "義德", exact: true }).click();
    await page.getByRole("link", { name: "建立新簽到單" }).click();

    await expect(page).toHaveURL(/\/class\/[^\/]+\/activity\/new/);

    // Fill form
    await page.locator('select[name="title"]').selectOption("自行輸入");
    await page.fill('input[name="titleOther"]', "E2E Test Class Activity");
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
    await expect(page).toHaveURL(/\/class\/[^\/]+/);
    await expect(
      page.getByRole("heading", { name: "E2E Test Class Activity" }),
    ).toBeVisible();
  });

  test("should have correct admin links on detail page", async ({
    page,
    loginAsAdmin,
    publishedClassActivity,
  }) => {
    const unitSlug = "yide";
    await page.goto(`/class/${unitSlug}/activity/detail/${publishedClassActivity.id}`);

    // Wait for the admin panel to be visible
    await expect(page.getByText("義德班務管理")).toBeVisible();

    // Check all three admin links have the correct href including unitSlug
    const checkRecordLink = page.getByRole('link', { name: "打卡名單" });
    await expect(checkRecordLink).toHaveAttribute('href', `/class/${unitSlug}/activity/checkrecord/${publishedClassActivity.id}`);

    const leaveRecordLink = page.getByRole('link', { name: "請假名單" });
    await expect(leaveRecordLink).toHaveAttribute('href', `/class/${unitSlug}/activity/leaverecord/${publishedClassActivity.id}`);

    const absentLink = page.getByRole('link', { name: "缺席名單" });
    await expect(absentLink).toHaveAttribute('href', `/class/${unitSlug}/activity/absent/${publishedClassActivity.id}`);
  });
});
