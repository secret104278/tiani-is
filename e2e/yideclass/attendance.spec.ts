import { expect, test } from "../fixtures";

test.describe("YiDeClass Attendance", () => {
  test("should allow check-in and leave", async ({
    page,
    loginAsUser,
    publishedClassActivity,
  }) => {
    // 1. Go to detail page of the activity created by fixture
    await page.goto(`/yideclass/activity/detail/${publishedClassActivity.id}`);

    // 2. Perform Check-in

    const checkInButton = page.getByRole("button", {
      name: "簽到",
      exact: true,
    });
    await expect(checkInButton).toBeEnabled();
    await checkInButton.click();

    const checkInDialog = page.getByRole("dialog", { name: "定位打卡" });
    // Assert the heading is visible instead of the dialog container
    await expect(
      checkInDialog.getByRole("heading", { name: "定位打卡" }),
    ).toBeVisible();

    await checkInDialog
      .getByRole("button", { name: "打卡", exact: true })
      .click();
    await expect(checkInDialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "已完成簽到" }),
    ).toBeVisible();

    // 3. Perform Leave (Take Leave)
    const leaveButton = page.getByRole("button", { name: "請假", exact: true });
    await leaveButton.click();

    // Change name to "確認請假" and assert the heading visibility
    const confirmDialog = page.getByRole("dialog", { name: "確認請假" });
    await expect(
      confirmDialog.getByRole("heading", { name: "確認請假" }),
    ).toBeVisible();

    await confirmDialog
      .getByRole("button", { name: "請假", exact: true })
      .click();

    await expect(page.getByRole("button", { name: "取消請假" })).toBeVisible();

    // 4. Cancel Leave
    await page.getByRole("button", { name: "取消請假" }).click();
    await expect(
      page.getByRole("button", { name: "請假", exact: true }),
    ).toBeVisible();
  });
});
