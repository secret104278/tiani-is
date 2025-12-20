import { expect, test } from "../fixtures";
import {
  performEtogetherCheckIn,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Participation - Check-in", () => {
  test("should allow user to check in", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const subgroupTitle = publishedEtogetherActivity.subgroups[0]!.title;
    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await registerForActivity(page, subgroupTitle);

    await performEtogetherCheckIn(page);

    await expect(
      page.getByRole("button", { name: "已完成簽到" }),
    ).toBeDisabled();
  });

  test("should allow organizer to manually check in participant", async ({
    page,
    loginAsAdmin,
    publishedEtogetherActivity,
  }) => {
    const subgroupTitle = publishedEtogetherActivity.subgroups[0]!.title;
    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await registerForActivity(page, subgroupTitle);

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
