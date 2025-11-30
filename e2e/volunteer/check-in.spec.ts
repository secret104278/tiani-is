import { expect, test } from "@playwright/test";
import {
  createActivity,
  ensureCasualCheckOut,
  performActivityCheckIn,
  performActivityCheckOut,
  performCasualCheckIn,
  performCasualCheckOut,
} from "../utils/volunteer-helpers";

test.describe("Volunteer Check-in", () => {
  test("should allow casual check-in and check-out", async ({ page }) => {
    await page.goto("/volunteer");

    await ensureCasualCheckOut(page);

    await performCasualCheckIn(page);

    await performCasualCheckOut(page);
  });

  test("should handle activity check-in/check-out flow correctly", async ({
    page,
  }) => {
    const { id: futureId } = await createActivity(page, { offsetHours: 24 });
    await page.goto(`/volunteer/activity/detail/${futureId}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    const checkInBtn = page.getByRole("button", { name: "簽到" });
    if (await checkInBtn.isVisible()) {
      await expect(checkInBtn).toBeDisabled();
    } else {
      await expect(checkInBtn).toBeDisabled();
    }

    const { id: currentId } = await createActivity(page, { offsetHours: 0 });
    await page.goto(`/volunteer/activity/detail/${currentId}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    await performActivityCheckIn(page);

    await performActivityCheckOut(page);
  });

  test("should view the check-in list for an activity", async ({ page }) => {
    const { id } = await createActivity(page, { offsetHours: 0 });
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
