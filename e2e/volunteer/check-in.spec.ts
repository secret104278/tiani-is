import { expect, test } from "../fixtures";
import {
  performActivityCheckIn,
  performActivityCheckOut,
} from "../utils/volunteer-helpers";

test.describe("Volunteer Check-in", () => {
  test("should allow casual check-in and check-out", async ({
    page,
    loginAsUser,
  }) => {
    // 1. Navigate to the volunteer home page
    await page.goto("/volunteer");

    // Locate the "日常工作" (Casual Work) card to scope our interactions
    const casualCard = page.locator(".card", { hasText: "日常工作" });
    await expect(casualCard).toBeVisible();

    // 2. Initial State Verification
    // Since seed-test-user.ts cleans up records, we expect a fresh state
    await expect(casualCard.getByText("今日尚未簽到")).toBeVisible();
    const actionButton = casualCard.getByRole("button");
    await expect(actionButton).toHaveText("簽到簽退");

    // --- PERFORM CHECK-IN ---

    // 3. Click Check-in and handle dialog
    // We prepare to wait for the tRPC mutation response to ensure DB is updated
    const checkInResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.casualCheckIn") &&
        res.status() === 200,
    );

    await actionButton.click();

    const dialogHeading = page.getByRole("heading", { name: "定位打卡" });
    await expect(dialogHeading).toBeVisible();

    // Click the "打卡" button inside the dialog
    const punchButton = page.getByRole("button", {
      name: "打卡",
      exact: true,
    });
    await expect(punchButton).toBeEnabled();
    await punchButton.click();

    // 4. Verification after Check-in
    await checkInResponsePromise;
    await expect(dialogHeading).toBeHidden();

    // UI should update to show check-in time and change button to "簽退" (Check-out)
    await expect(
      casualCard.getByText(/簽到：\d{4}\/\d{2}\/\d{2}/),
    ).toBeVisible();
    await expect(actionButton).toHaveText("簽退");

    // --- PERFORM CHECK-OUT ---

    // 5. Click Check-out and handle dialog
    const checkOutResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.casualCheckIn") &&
        res.status() === 200,
    );

    await actionButton.click();
    await expect(dialogHeading).toBeVisible();

    // Punch out
    await punchButton.click();

    // 6. Final Verification
    await checkOutResponsePromise;
    await expect(dialogHeading).toBeHidden();

    // After checking out, UI shows both times and button allows "再次簽到" (Check-in again)
    await expect(casualCard.getByText(/簽到：/)).toBeVisible();
    await expect(casualCard.getByText(/簽退：/)).toBeVisible();
    await expect(actionButton).toHaveText("再次簽到");
  });

  test("should handle activity check-in/check-out flow correctly", async ({
    page,
    loginAsUser,
    testUser,
    createVolunteerActivity,
  }) => {
    const futureActivity = await createVolunteerActivity(testUser.id, {
      startDateTime: new Date(Date.now() + 86400000),
    });
    await page.goto(`/volunteer/activity/detail/${futureActivity.id}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    const checkInBtn = page.getByRole("button", { name: "簽到" });
    if (await checkInBtn.isVisible()) {
      await expect(checkInBtn).toBeDisabled();
    } else {
      await expect(checkInBtn).toBeDisabled();
    }

    const currentActivity = await createVolunteerActivity(testUser.id);
    await page.goto(`/volunteer/activity/detail/${currentActivity.id}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    await performActivityCheckIn(page);

    await performActivityCheckOut(page);
  });

  test("should view the check-in list for an activity", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    const { id } = publishedActivity;
    await page.goto(`/volunteer/activity/detail/${id}`);

    const listBtn = page.getByRole("link", { name: "打卡名單" });
    await expect(listBtn).toBeVisible();

    await listBtn.click();
    await expect(page).toHaveURL(
      new RegExp(`/volunteer/activity/checkrecord/${id}`),
    );

    await expect(page.locator("body")).toBeVisible();
  });
});
