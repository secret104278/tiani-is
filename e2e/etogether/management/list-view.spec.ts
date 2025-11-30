import { expect, test } from "@playwright/test";
import {
  createEtogetherActivity,
  registerForActivity,
} from "../../utils/etogether-helpers";

test.describe("Activity Management - List View", () => {
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
