import { expect, test } from "@playwright/test";
import { createEtogetherActivity } from "../../utils/etogether-helpers";

test.describe("Activity Management - Create", () => {
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
});
