import { expect, test } from "@playwright/test";
import { Role } from "@prisma/client";
import { loginAs } from "../utils/auth-helpers";
import {
  createActivity,
  setManualCheckInTimes,
} from "../utils/volunteer-helpers";

test.describe
  .serial("Authorization and Admin Actions", () => {
    let publishedActivityId: string;
    let inReviewActivityId: string;
    const testUserId = "e2e-test-user-id";

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginAs(context, [Role.TIANI_ADMIN, Role.VOLUNTEER_ADMIN]);

      const { id: inReviewId } = await createActivity(page, {
        location: "Auth Test Location",
        description: "Auth Test Description",
      });
      inReviewActivityId = inReviewId;
      await expect(page.getByText("審核中")).toBeVisible();

      const { id: publishedId } = await createActivity(page, {
        location: "Auth Test Published",
        description: "Auth Test Published Desc",
      });
      await page.getByRole("button", { name: "核准" }).click();
      await expect(page.getByText("已發佈")).toBeVisible();

      publishedActivityId = publishedId;

      await context.close();
    });

    test("should prevent unauthorized access to manage activity", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${publishedActivityId}`);

      await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
      await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();

      await context.close();
    });

    test("should prevent non-manager from managing a non-published activity", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${inReviewActivityId}`);

      await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
      await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();
      await expect(page.getByText("找不到工作")).toBeVisible();

      await context.close();
    });

    test("should allow tiani_admin to approve an activity in INREVIEW status", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${inReviewActivityId}`);
      await expect(page.getByText("審核中")).toBeVisible();

      await page.getByRole("button", { name: "核准" }).click();

      await expect(page.getByText("已發佈")).toBeVisible();
      await expect(page.getByRole("button", { name: "核准" })).toBeHidden();

      await context.close();
    });

    test("should allow manager to manage a published activity", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.VOLUNTEER_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${publishedActivityId}`);

      await expect(page.getByRole("button", { name: "編輯" })).toBeVisible();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeVisible();

      await page.getByRole("button", { name: "撤銷" }).click();

      await expect(
        page.getByRole("heading", { name: "確認撤銷" }),
      ).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "撤銷" })
        .click();

      await expect(page).toHaveURL("/volunteer");

      await context.close();
    });

    test("should prevent creating a record with invalid times", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/admin/working/${testUserId}`);
      await expect(page.getByText("E2E Test User")).toBeVisible();

      await page.getByRole("button", { name: "手動日常打卡" }).click();
      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeVisible();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayInput = `${year}-${month}-${day}`;

      await setManualCheckInTimes(
        page,
        `${todayInput}T23:00`,
        `${todayInput}T10:00`,
      );

      await page.getByRole("button", { name: "確認" }).click();

      await expect(
        page.getByRole("button", { name: "簽退時間必須晚於簽到時間" }),
      ).toBeVisible();

      await context.close();
    });

    test("should allow admin to manage casual check records", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/admin/working/${testUserId}`);
      await expect(page.getByText("E2E Test User")).toBeVisible();

      await page.getByRole("button", { name: "手動日常打卡" }).click();
      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeVisible();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const todayInput = `${year}-${month}-${day}`;
      const todayDisplay = `${year}/${month}/${day}`;

      await setManualCheckInTimes(
        page,
        `${todayInput}T10:00`,
        `${todayInput}T11:00`,
      );

      await page.getByRole("button", { name: "確認" }).click();

      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeHidden();

      const row = page
        .getByRole("row", { name: new RegExp(todayDisplay) })
        .filter({ hasText: "日常工作" })
        .filter({ hasText: "10:00" })
        .filter({ hasText: "11:00" });
      await expect(row).toBeVisible();
      await expect(row).toContainText("10:00");
      await expect(row).toContainText("11:00");

      const statPanel = page.locator(".stat", { hasText: "總服務小時" });
      await expect(statPanel.locator(".stat-value")).toHaveText(/1\.00/);

      await context.close();
    });

    test("should prevent non-admin from managing casual check records", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/volunteer/admin/working/${testUserId}`);

      await expect(
        page.getByRole("button", { name: "手動日常打卡" }),
      ).toBeHidden();

      await page.waitForLoadState("networkidle");
      await expect(page.locator(".loading")).toBeHidden({ timeout: 20000 });

      await expect(
        page.getByText("只有管理員或本人可以進行此操作"),
      ).toBeVisible();

      await context.close();
    });
  });
