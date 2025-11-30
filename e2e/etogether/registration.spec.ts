import { expect, test } from "@playwright/test";
import {
  cancelRegistration,
  createEtogetherActivity,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Participation - Registration", () => {
  test("should register for activity", async ({ page }) => {
    const { subgroups } = await createEtogetherActivity(page);
    const firstSubgroup = subgroups[0]!;

    await registerForActivity(page, firstSubgroup.title);

    await expect(page.getByText("我的報名表")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`：${firstSubgroup.title}$`)),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });

  test("should cancel registration", async ({ page }) => {
    const { subgroups } = await createEtogetherActivity(page);
    const firstSubgroup = subgroups[0]!;
    await registerForActivity(page, firstSubgroup.title);

    await expect(page.getByText("我的報名表")).toBeVisible();

    await cancelRegistration(page);

    await expect(page.getByText("我的報名表")).not.toBeVisible();
  });
});
