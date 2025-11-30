import { expect, test } from "@playwright/test";
import {
  createEtogetherActivity,
  registerForActivity,
} from "../../utils/etogether-helpers";

test.describe("Activity Management - Revoke", () => {
  test("should revoke activity without registrations", async ({ page }) => {
    const { title } = await createEtogetherActivity(page, {
      title: "Activity to Revoke",
      location: "Test Location",
    });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page).toHaveURL("/etogether");

    await expect(page.getByText(title)).not.toBeVisible();
  });

  test("should not revoke activity with registrations", async ({ page }) => {
    const { title } = await createEtogetherActivity(page, {
      title: "Activity with Registration",
      location: "Test Location",
    });

    await registerForActivity(page, "Group A");

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page.getByText("無法撤銷已有人報名的活動")).toBeVisible();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });
});
