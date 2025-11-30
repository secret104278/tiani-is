import { expect, test } from "@playwright/test";

test.describe("YiDeClass Attendance", () => {
  test("should allow check-in and leave", async ({ page }) => {
    await page.goto("/yideclass");
    await page.getByRole("link", { name: "建立新簽到單" }).click();

    await page.locator('select[name="title"]').selectOption({ index: 0 });
    await page.locator('select[name="location"]').selectOption({ index: 0 });

    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2");

    await page.getByRole("button", { name: "送出" }).click();

    const checkInButton = page.getByRole("button", { name: /簽到/ });

    try {
      await expect(checkInButton).toBeEnabled({ timeout: 10000 });
    } catch (e) {
      console.log("Check-in button text:", await checkInButton.innerText());
      throw e;
    }

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

    await expect(
      page.getByRole("button", { name: "已完成簽到" }),
    ).toBeVisible();

    const leaveButton = page.getByRole("button", { name: "請假", exact: true });
    await leaveButton.click();

    const confirmDialog = page.getByRole("dialog", { name: "確認請假" });
    await expect(
      confirmDialog.getByRole("heading", { name: "確認請假" }),
    ).toBeVisible();
    await confirmDialog
      .getByRole("button", { name: "請假", exact: true })
      .click();

    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("button", { name: "取消請假" })).toBeVisible();

    await page.getByRole("button", { name: "取消請假" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("button", { name: "請假", exact: true }),
    ).toBeVisible();
  });
});
