import { expect, test } from "../fixtures";
import {
  cancelRegistration,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Participation - Registration", () => {
  test("should register for activity", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const subgroupTitle = publishedEtogetherActivity.subgroups[0]!.title;

    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await registerForActivity(page, subgroupTitle);

    await expect(page.getByText("我的報名表")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`：${subgroupTitle}$`)),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });

  test("should cancel registration", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const subgroupTitle = publishedEtogetherActivity.subgroups[0]!.title;
    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await registerForActivity(page, subgroupTitle);

    await expect(page.getByText("我的報名表")).toBeVisible();

    await cancelRegistration(page);

    await expect(page.getByText("我的報名表")).not.toBeVisible();
  });
});
