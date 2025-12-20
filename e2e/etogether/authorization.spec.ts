import { Role } from "@prisma/client";
import { expect, test } from "../fixtures";
import { loginAs } from "../utils/auth-helpers";

test.describe
  .serial("Authorization", () => {
    let activityId: string;

    test.beforeAll(async ({ browser, db }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.ETOGETHER_ADMIN]);
      const page = await context.newPage();

      const adminUser = await db.user.create({
        data: {
          id: `etogether-admin-${Date.now()}`,
          email: `etogether-admin-${Date.now()}@example.com`,
          name: "Etogether Admin",
          roles: [Role.ETOGETHER_ADMIN],
        },
      });

      const now = new Date();
      const startDateTime = new Date(now.getTime() + 3600000);
      const endDateTime = new Date(startDateTime.getTime() + 7200000);

      const activity = await db.etogetherActivity.create({
        data: {
          title: `Auth Test Activity ${Date.now()}`,
          description: "Auth Test Description",
          location: "Auth Test Location",
          startDateTime,
          endDateTime,
          status: "PUBLISHED",
          organiserId: adminUser.id,
          subgroups: {
            create: [{ title: "Group 1" }],
          },
        },
      });

      activityId = activity.id.toString();

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
