import { expect, test } from "../fixtures";

test.describe("Volunteer Registration Tests", () => {
  test("should register for an activity", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    await page.goto(`/volunteer/activity/detail/${publishedActivity.id}`);

    await page.getByRole("button", { name: "報名" }).click();

    await expect(page.getByText("目前有 1 人報名")).toBeVisible();

    await expect(page.getByRole("checkbox")).toBeVisible();

    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });

  test("should unregister from an activity", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    await page.goto(`/volunteer/activity/detail/${publishedActivity.id}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("目前有 1 人報名")).toBeVisible();

    await page.getByRole("button", { name: "取消報名" }).click();

    await expect(page.getByText("確定要取消報名嗎？")).toBeVisible();
    await page.getByRole("button", { name: "確認" }).click();

    await expect(page.getByText("目前有 0 人報名")).toBeVisible();

    await expect(page.getByRole("checkbox")).toBeVisible();

    await expect(page.getByRole("button", { name: "報名" })).toBeVisible();
  });

  test("should handle activity registration based on participant status and headcount", async ({
    page,
    loginAsUser,
    createVolunteerActivity,
    testUser,
  }) => {
    const endedActivity = await createVolunteerActivity(testUser.id, {
      startDateTime: new Date(Date.now() - 86600000),
      endDateTime: new Date(Date.now() - 86400000),
    });
    await page.goto(`/volunteer/activity/detail/${endedActivity.id}`);

    const endedButton = page.getByRole("button", { name: "已結束" });
    await expect(endedButton).toBeVisible();
    await expect(endedButton).toHaveClass(/btn-disabled/);

    const participantActivity = await createVolunteerActivity(testUser.id);
    await page.goto(`/volunteer/activity/detail/${participantActivity.id}`);
    await page.getByRole("button", { name: "報名" }).click();

    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
