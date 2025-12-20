import { VolunteerActivityStatus } from "@prisma/client";
import { expect, test } from "../fixtures";
import { createActivity } from "../utils/volunteer-helpers";

test.describe("Volunteer Activity Management", () => {
  test("should create a new activity", async ({ page, loginAsUser }) => {
    await page.goto("/volunteer");
    await page.getByRole("link", { name: "建立新工作" }).click();
    await expect(page).toHaveURL("/volunteer/activity/new");

    const { location, description } = await createActivity(page, {
      description: "Description New",
      offsetHours: 1,
    });

    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);
    await expect(page.getByText(location)).toBeVisible();
    await expect(page.getByText("Description New")).toBeVisible();
  });

  test("should approve an activity", async ({
    page,
    loginAsAdmin,
    createVolunteerActivity,
    testUser,
  }) => {
    const activity = await createVolunteerActivity(testUser.id, {
      status: VolunteerActivityStatus.INREVIEW,
    });
    await page.goto(`/volunteer/activity/detail/${activity.id}`);

    await expect(page.getByRole("button", { name: "核准" })).toBeVisible();
    await page.getByRole("button", { name: "核准" }).click();

    await expect(page.getByText("已發佈")).toBeVisible();
    await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
  });

  test("should edit an activity", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    const { id } = publishedActivity;

    await page.goto(`/volunteer/activity/detail/${id}`);

    await page.getByRole("button", { name: "編輯" }).click();
    await expect(page).toHaveURL(`/volunteer/activity/edit/${id}`);

    const newLocation = `Updated Location ${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    await page.fill('input[name="location"]', newLocation);
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(`/volunteer/activity/detail/${id}`);
    await expect(page.getByText(newLocation)).toBeVisible();
  });

  test("should revoke an activity", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    const { id } = publishedActivity;

    await page.goto(`/volunteer/activity/detail/${id}`);

    await page.getByRole("button", { name: "撤銷" }).click();

    await expect(page.getByText("確認撤銷")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "撤銷", exact: true })
      .click();

    await expect(page).toHaveURL("/volunteer");

    await page.goto(`/volunteer/activity/detail/${id}`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("should update activity details successfully", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    const { id } = publishedActivity;

    await page.goto(`/volunteer/activity/detail/${id}`);

    await page.getByRole("button", { name: "編輯" }).click();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const newLoc = `New Loc ${timestamp}-${random}`;
    const newDesc = `New Desc ${timestamp}-${random}`;

    await page.fill('input[name="location"]', newLoc);
    await page.fill('textarea[name="description"]', newDesc);
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(`/volunteer/activity/detail/${id}`);
    await expect(page.getByText(newLoc)).toBeVisible();
    await expect(page.getByText(newDesc)).toBeVisible();
  });

  test("should submit a draft activity for review", async ({
    page,
    loginAsUser,
    draftActivity,
  }) => {
    await page.goto(`/volunteer/activity/detail/${draftActivity.id}`);

    await expect(page.getByText("草稿")).toBeVisible();

    await page.getByRole("button", { name: "送出申請" }).click();

    await expect(page.getByText("審核中")).toBeVisible();
    await expect(page.getByRole("button", { name: "送出申請" })).toBeHidden();
  });

  test("should filter activities in list view", async ({
    page,
    loginAsUser,
    publishedActivity,
  }) => {
    const uniqueLocation = publishedActivity.location;
    await page.goto("/volunteer");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("volunteerActivity.getAllActivitiesInfinite") &&
        response.status() === 200,
    );
    await page.getByLabel("我發起的").check();
    await responsePromise;

    await page.waitForTimeout(1000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const escapedLocation = uniqueLocation.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    await expect(page.getByText(new RegExp(escapedLocation))).toBeVisible();

    await page.getByLabel("我發起的").uncheck();
    await expect(
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes("volunteerActivity.getAllActivitiesInfinite") &&
          response.status() === 200,
      ),
    ).resolves.toBeTruthy();

    await expect(page.getByText(new RegExp(escapedLocation))).toBeVisible();
  });
});
