import { expect, test } from "@playwright/test";

test.describe("YiDeClass Attendance", () => {
  test("should allow check-in and leave", async ({ page }) => {
    // 1. Create a class activity that is open for check-in (starts in 30 mins)
    await page.goto("/yideclass");
    await page.getByRole("link", { name: "建立新簽到單" }).click();

    // Fill form
    await page.locator('select[name="title"]').selectOption({ index: 0 });
    await page.locator('select[name="location"]').selectOption({ index: 0 });

    const now = new Date();
    // Set start time to now (or 5 mins in future) to ensure it is within check-in window
    // activityIsStarted = now > start - 1h.
    // So even if start is 30m future, it is valid.
    now.setMinutes(now.getMinutes() + 5);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2"); // 2 hours duration

    await page.getByRole("button", { name: "送出" }).click();

    // 2. We are now on the detail page
    // Verify check-in button is enabled
    // Button text should contain "簽到" and not have "課程開始前" or "課程已結束" if logic allows checkin.
    const checkInButton = page.getByRole("button", { name: /簽到/ });

    // Debug: print text if fails
    try {
      await expect(checkInButton).toBeEnabled({ timeout: 10000 });
    } catch (e) {
      console.log("Check-in button text:", await checkInButton.innerText());
      throw e;
    }

    // 3. Perform Check-in
    await checkInButton.click();
    const checkInDialog = page.getByRole("dialog", { name: "定位打卡" });
    await expect(
      checkInDialog.getByRole("heading", { name: "定位打卡" }),
    ).toBeVisible();
    await checkInDialog
      .getByRole("button", { name: "打卡", exact: true })
      .click();

    await expect(
      checkInDialog.getByRole("heading", { name: "定位打卡" }),
    ).toBeHidden();

    // Verify button says "已完成簽到"
    await expect(
      page.getByRole("button", { name: "已完成簽到" }),
    ).toBeVisible();

    // 4. Test Leave (請假)
    // The page might need reload or state update. The code calls `refetchIsCheckedIn` on success.
    // Leave button: "請假"
    const leaveButton = page.getByRole("button", { name: "請假", exact: true });
    await leaveButton.click();

    // Confirm dialog
    const confirmDialog = page.getByRole("dialog", { name: "確認請假" });
    await expect(
      confirmDialog.getByRole("heading", { name: "確認請假" }),
    ).toBeVisible();
    await confirmDialog
      .getByRole("button", { name: "請假", exact: true })
      .click();

    // Verify button changes to "取消請假"
    // Note: The page reloads on success of takeLeave.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("button", { name: "取消請假" })).toBeVisible();

    // 5. Cancel Leave
    await page.getByRole("button", { name: "取消請假" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("button", { name: "請假", exact: true }),
    ).toBeVisible();
  });
});
