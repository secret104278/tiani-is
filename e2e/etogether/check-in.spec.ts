import { expect, test } from "@playwright/test";
import {
  createEtogetherActivity,
  performEtogetherCheckIn,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Participation - Check-in", () => {
  test("should allow user to check in", async ({ page }) => {
    await createEtogetherActivity(page);
    await registerForActivity(page, "Group A");

    await performEtogetherCheckIn(page);

    await expect(
      page.getByRole("button", { name: "已完成簽到" }),
    ).toBeDisabled();
  });

  test("should allow organizer to manually check in participant", async ({
    page,
  }) => {
    await createEtogetherActivity(page);
    await registerForActivity(page, "Group A");

    await page.getByRole("button", { name: "報名名單" }).click();
    await expect(page.getByRole("heading", { name: "報名名單" })).toBeVisible();

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();

    await expect(checkbox).toBeChecked();

    await expect(page.getByText("總報到人數").locator("..")).toContainText("1");
    await expect(
      page.getByRole("columnheader", { name: "簽到：1 / 報名：1" }),
    ).toBeVisible();
  });
});
