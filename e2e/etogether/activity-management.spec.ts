import { expect, test } from "@playwright/test";
import {
  createEtogetherActivity,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Activity Management", () => {
  test("should create activity with all fields", async ({ page }) => {
    const { title, location, subgroups, description } =
      await createEtogetherActivity(page, {
        title: "New E2E Activity",
        location: "E2E Location",
        duration: "3",
        subgroups: [
          { title: "Subgroup A", description: "Description for Subgroup A" },
        ],
        description: "Main Activity Description",
      });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(`地點：${location}`)).toBeVisible();
    await expect(page.getByText("時數：3 小時")).toBeVisible();
    const firstSubgroup = subgroups[0]!;
    await expect(
      page.getByRole("heading", { name: firstSubgroup.title }),
    ).toBeVisible();
    await expect(page.getByText(firstSubgroup.description!)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });

  test("should show validation error when required fields are empty", async ({
    page,
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

  test("should edit activity title and location", async ({ page }) => {
    await createEtogetherActivity(page, {
      title: "Original Activity Title",
      location: "Original Location",
    });

    await page.getByRole("link", { name: "編輯" }).click();

    await page.locator('input[name="title"]').fill("Updated Activity Title");
    await page.locator('input[name="location"]').fill("Updated Location");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(
      page.getByRole("heading", { name: "Updated Activity Title" }),
    ).toBeVisible();
    await expect(page.getByText("地點：Updated Location")).toBeVisible();
  });

  test("should revoke activity without registrations", async ({ page }) => {
    const { title } = await createEtogetherActivity(page, {
      title: "Activity to Revoke",
      location: "Test Location",
    });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page).toHaveURL("/etogether");

    await expect(page.getByText(title)).not.toBeVisible();
  });

  test("should not revoke activity with registrations", async ({ page }) => {
    const { title } = await createEtogetherActivity(page, {
      title: "Activity with Registration",
      location: "Test Location",
    });

    await registerForActivity(page, "Group A");

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page.getByText("無法撤銷已有人報名的活動")).toBeVisible();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("should filter activities by participation status", async ({ page }) => {
    const { title: participatedTitle } = await createEtogetherActivity(page, {
      title: "Participated Activity",
    });
    await registerForActivity(page, "Group A");

    const { title: nonParticipatedTitle } = await createEtogetherActivity(
      page,
      {
        title: "Non-Participated Activity",
      },
    );

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
