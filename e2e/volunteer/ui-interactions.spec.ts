import { expect, test } from "@playwright/test";
import { createActivity } from "../utils/volunteer-helpers";

test.describe("UI Interactions and Edge Cases", () => {
  test("should handle non-existent activity gracefully", async ({ page }) => {
    await page.goto("/volunteer/activity/detail/99999");

    await expect(page.getByText("This page could not be found")).toBeVisible();
  });

  test("should display correct UI elements and confirmation dialogs", async ({
    page,
  }) => {
    // Setup: Create a new activity to work with
    const { location: uniqueLocation } = await createActivity(page, {
      description: "UI Test Description",
      offsetHours: 1,
    });

    await expect(page.getByText("審核中")).toBeVisible();
    await expect(page.getByRole("button", { name: "核准" })).toBeVisible();

    await page.getByRole("button", { name: "核准" }).click();

    await expect(page.getByText("已發佈")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "分享至Line" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();

    await page.getByRole("button", { name: "取消報名" }).click();

    await expect(page.getByText("確定要取消報名嗎？")).toBeVisible();

    await page.getByRole("button", { name: "取消", exact: true }).click();

    await expect(page.getByText("確定要取消報名嗎？")).toBeHidden();

    await page.getByRole("button", { name: "撤銷" }).click();

    await expect(page.getByRole("heading", { name: "確認撤銷" })).toBeVisible();

    const revokeButtons = page.getByRole("button", { name: "撤銷" });
    const count = await revokeButtons.count();
    await revokeButtons.nth(count - 1).click();

    await expect(page).toHaveURL("/volunteer");
  });
});
