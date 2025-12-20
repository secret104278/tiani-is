import { expect, test } from "../fixtures";
import { registerForActivity } from "../utils/etogether-helpers";

test.describe("Etogether Activity Management", () => {
  test("should create activity with all fields", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/etogether/activity/new");

    const timestamp = Date.now();
    const title = `New E2E Activity ${timestamp}`;
    const location = "E2E Location";
    const description = "Main Activity Description";

    await page.locator('input[name="title"]').fill(title);
    await page.locator('input[name="location"]').fill(location);

    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);

    await page.locator('input[name="startDateTime"]').fill(dateString);
    await page.locator('input[name="duration"]').fill("3");

    await page.getByRole("button", { name: "新增分組" }).click();
    await page.locator('input[name="subgroups.0.title"]').fill("Subgroup A");
    await page
      .locator('textarea[name="subgroups.0.description"]')
      .fill("Description for Subgroup A");

    await page.locator('textarea[name="description"]').fill(description);

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(`地點：${location}`)).toBeVisible();
    await expect(page.getByText("時數：3 小時")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Subgroup A" }),
    ).toBeVisible();
    await expect(page.getByText("Description for Subgroup A")).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });

  test("should show validation error when required fields are empty", async ({
    page,
    loginAsAdmin,
  }) => {
    await page.goto("/etogether/activity/new");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(
      page
        .locator("text=Expected date, received null")
        .or(page.locator("text=Required")),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/etogether\/activity\/new/);
  });

  test("should edit activity title and location", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await page.getByRole("link", { name: "編輯" }).click();

    await page.locator('input[name="title"]').fill("Updated Activity Title");
    await page.locator('input[name="location"]').fill("Updated Location");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(
      page.getByRole("heading", { name: "Updated Activity Title" }),
    ).toBeVisible();
    await expect(page.getByText("地點：Updated Location")).toBeVisible();
  });

  test("should revoke activity without registrations", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const { title } = publishedEtogetherActivity;

    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page).toHaveURL("/etogether");

    await expect(page.getByText(title)).not.toBeVisible();
  });

  test("should not revoke activity with registrations", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const { title } = publishedEtogetherActivity;

    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await registerForActivity(page, "Group 1");

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page.getByText("無法撤銷已有人報名的活動")).toBeVisible();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("should filter activities by participation status", async ({
    page,
    loginAsUser,
    createEtogetherActivity,
    testUser,
  }) => {
    const participatedActivity = await createEtogetherActivity(testUser.id);
    const participatedTitle = participatedActivity.title;
    await page.goto(`/etogether/activity/detail/${participatedActivity.id}`);
    await registerForActivity(page, "Group 1");

    const nonParticipatedActivity = await createEtogetherActivity(testUser.id);
    const nonParticipatedTitle = nonParticipatedActivity.title;

    await page.goto("/etogether");

    await expect(
      page.getByRole("link", { name: participatedTitle }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: nonParticipatedTitle }).first(),
    ).toBeVisible();

    await page.getByRole("checkbox", { name: "我參加的" }).check();

    await expect(
      page.getByRole("link", { name: participatedTitle }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: nonParticipatedTitle }),
    ).not.toBeVisible();
  });
});
