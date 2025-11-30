import { expect, test } from "@playwright/test";
import { createActivity } from "../utils/volunteer-helpers";

test.describe("Volunteer Registration Tests", () => {
  test("should register for an activity", async ({ page }) => {
    await createActivity(page);

    await page.getByRole("button", { name: "報名" }).click();

    await expect(page.getByText("目前有 1 人報名")).toBeVisible();

    await expect(page.getByRole("checkbox")).toBeVisible();

    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });

  test("should unregister from an activity", async ({ page }) => {
    await createActivity(page);
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
  }) => {
    const workerIndex = test.info().workerIndex ?? 0;
    await createActivity(page, {
      offsetHours: -3,
      location: `Ended Activity w${workerIndex}-${Date.now()}`,
    });

    const endedButton = page.getByRole("button", { name: "已結束" });
    await expect(endedButton).toBeVisible();
    await expect(endedButton).toHaveClass(/btn-disabled/);

    await createActivity(page, {
      location: `Participant Activity w${workerIndex}-${Date.now()}`,
    });
    await page.getByRole("button", { name: "報名" }).click();

    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
