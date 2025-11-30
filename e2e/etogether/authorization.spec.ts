import { expect, test } from "@playwright/test";
import { Role } from "@prisma/client";
import { loginAs } from "../utils/auth-helpers";
import { createEtogetherActivity } from "../utils/etogether-helpers";

test.describe
  .serial("Authorization", () => {
    let activityId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.ETOGETHER_ADMIN]);
      const page = await context.newPage();

      const { id } = await createEtogetherActivity(page, {
        title: "Auth Test Activity",
      });
      activityId = id;

      await context.close();
    });

    test("should show management buttons for admin", async ({ browser }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.ETOGETHER_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/etogether/activity/detail/${activityId}`);

      await expect(page.getByRole("link", { name: "編輯" })).toBeVisible();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeVisible();

      await context.close();
    });

    test("should hide management buttons for non-admin", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/etogether/activity/detail/${activityId}`);

      await expect(page.getByRole("link", { name: "編輯" })).toBeHidden();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();

      await context.close();
    });

    test("should allow non-admin to register for activity", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/etogether/activity/detail/${activityId}`);

      await expect(
        page.getByRole("button", { name: "報名", exact: true }),
      ).toBeVisible();

      await context.close();
    });
  });
