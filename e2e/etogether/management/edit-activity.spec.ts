import { expect, test } from "@playwright/test";
import { createEtogetherActivity } from "../../utils/etogether-helpers";

test.describe("Activity Management - Edit", () => {
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
});
