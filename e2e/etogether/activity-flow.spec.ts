import { expect, test } from "../fixtures";
import { registerForActivity } from "../utils/etogether-helpers";

test.describe("Etogether Activity Flow", () => {
  test("should create activity and register", async ({
    page,
    loginAsUser,
    publishedEtogetherActivity,
  }) => {
    const { title } = publishedEtogetherActivity;
    const subgroupTitle = publishedEtogetherActivity.subgroups[0]!.title;

    await page.goto(
      `/etogether/activity/detail/${publishedEtogetherActivity.id}`,
    );

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await registerForActivity(page, subgroupTitle);

    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
