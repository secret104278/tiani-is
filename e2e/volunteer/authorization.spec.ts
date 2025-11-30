import { expect, test } from "@playwright/test";
import { Role } from "@prisma/client";
import { loginAs } from "../utils/auth-helpers";

test.describe
  .serial("Authorization and Admin Actions", () => {
    let publishedActivityId: string;
    let inReviewActivityId: string;
    const testUserId = "e2e-test-user-id";

    test.beforeAll(async ({ browser }) => {
      // Create a PUBLISHED activity as Admin for testing access
      const context = await browser.newContext();
      const page = await context.newPage();

      // Login as Admin (default seed user is admin)
      // Actually, seedTestUser() creates the user in DB, but we need to login.
      // auth.setup.ts usually does this, but we are in a new context.
      // We can use loginAs with Admin roles.
      await loginAs(context, [Role.TIANI_ADMIN, Role.VOLUNTEER_ADMIN]);

      // Create Activity
      await page.goto("/volunteer/activity/new");
      await page.locator('select[name="title"]').selectOption({ index: 1 });
      await page.fill('input[name="headcount"]', "5");
      await page.fill('input[name="location"]', "Auth Test Location");

      const now = new Date();
      now.setMinutes(now.getMinutes() + 60);
      const offset = now.getTimezoneOffset() * 60000;
      const dateString = new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      await page.fill('input[name="startDateTime"]', dateString);
      await page.fill('input[name="duration"]', "2");
      await page.fill('textarea[name="description"]', "Auth Test Description");

      await page.getByRole("button", { name: "送出" }).click();
      await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

      // Verify it is INREVIEW (default)
      await expect(page.getByText("審核中")).toBeVisible();

      // Save ID for INREVIEW test
      const url = page.url();
      inReviewActivityId = url.split("/").pop()!;

      // Create another one for PUBLISHED test
      await page.goto("/volunteer/activity/new");
      await page.locator('select[name="title"]').selectOption({ index: 1 });
      await page.fill('input[name="headcount"]', "5");
      await page.fill('input[name="location"]', "Auth Test Published");
      await page.fill('input[name="startDateTime"]', dateString);
      await page.fill('input[name="duration"]', "2");
      await page.fill(
        'textarea[name="description"]',
        "Auth Test Published Desc",
      );
      await page.getByRole("button", { name: "送出" }).click();
      await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

      // Approve it to make it PUBLISHED
      await page.getByRole("button", { name: "核准" }).click();
      await expect(page.getByText("已發佈")).toBeVisible();

      publishedActivityId = page.url().split("/").pop()!;

      await context.close();
    });

    test("should prevent unauthorized access to manage activity", async ({
      browser,
    }) => {
      // 4.1
      const context = await browser.newContext();
      // Login as user with NO admin roles
      await loginAs(context, []);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${publishedActivityId}`);

      // Verify buttons are hidden
      await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
      await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();

      await context.close();
    });

    test("should prevent non-manager from managing a non-published activity", async ({
      browser,
    }) => {
      // 4.3
      const context = await browser.newContext();
      await loginAs(context, []);
      const page = await context.newPage();

      // Try to visit INREVIEW activity
      // Note: Non-managers might not be able to see INREVIEW activities at all (404 or 403),
      // or see them but without controls.
      // The requirement says "Attempt to approve, edit, or revoke... buttons hidden".
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
      // 4.4
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${inReviewActivityId}`);
      await expect(page.getByText("審核中")).toBeVisible();

      // Approve
      await page.getByRole("button", { name: "核准" }).click();

      // Verify
      await expect(page.getByText("已發佈")).toBeVisible();
      await expect(page.getByRole("button", { name: "核准" })).toBeHidden();

      await context.close();
    });

    test("should allow manager to manage a published activity", async ({
      browser,
    }) => {
      // 4.2
      const context = await browser.newContext();
      await loginAs(context, [Role.VOLUNTEER_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/activity/detail/${publishedActivityId}`);

      // Verify buttons visible
      await expect(page.getByRole("button", { name: "編輯" })).toBeVisible();
      await expect(page.getByRole("button", { name: "撤銷" })).toBeVisible();

      // Test Revoke
      await page.getByRole("button", { name: "撤銷" }).click();

      // Confirm Dialog (5.3)
      await expect(
        page.getByRole("heading", { name: "確認撤銷" }),
      ).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "撤銷" })
        .click();

      // Verify Revocation (Redirects or shows status)
      // Based on previous finding, it redirects to /volunteer and activity might be gone from list.
      await expect(page).toHaveURL("/volunteer");

      await context.close();
    });

    test("should prevent creating a record with invalid times", async ({
      browser,
    }) => {
      // 4.8
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/admin/working/${testUserId}`);
      await expect(page.getByText("E2E Test User")).toBeVisible();

      // Open Manual Check-in Dialog
      await page.getByRole("button", { name: "手動日常打卡" }).click();
      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeVisible();

      // Invalid times (CheckOut < CheckIn)
      await page.evaluate(() => {
        const setNativeValue = (element: HTMLInputElement, value: string) => {
          const valueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          valueSetter?.call(element, value);
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.dispatchEvent(new Event("blur", { bubbles: true }));
        };
        const checkIn = document.querySelector(
          'input[name="checkInAt"]',
        ) as HTMLInputElement;
        const checkOut = document.querySelector(
          'input[name="checkOutAt"]',
        ) as HTMLInputElement;
        if (checkIn && checkOut) {
          const today = new Date()
            .toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, "-");
          setNativeValue(checkIn, `${today}T23:00`);
          setNativeValue(checkOut, `${today}T10:00`); // Earlier than check-in
        }
      });

      // Trigger validation
      await page.getByRole("button", { name: "確認" }).click();

      // Check for error on the button or in the form
      // The button text changes to error message
      await expect(
        page.getByRole("button", { name: "簽退時間必須晚於簽到時間" }),
      ).toBeVisible();

      await context.close();
    });

    test("should allow admin to manage casual check records", async ({
      browser,
    }) => {
      // 4.7, 4.9
      // This test is failing because the table with check-in records does not appear
      // after a new record is added. This might be an application bug.
      const context = await browser.newContext();
      await loginAs(context, [Role.TIANI_ADMIN]);
      const page = await context.newPage();

      await page.goto(`/volunteer/admin/working/${testUserId}`);
      await expect(page.getByText("E2E Test User")).toBeVisible();

      // Open Manual Check-in Dialog
      await page.getByRole("button", { name: "手動日常打卡" }).click();
      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeVisible();

      // 4.7: Valid times
      await page.evaluate(() => {
        const setNativeValue = (element: HTMLInputElement, value: string) => {
          const valueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          valueSetter?.call(element, value);
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.dispatchEvent(new Event("blur", { bubbles: true }));
        };
        const checkIn = document.querySelector(
          'input[name="checkInAt"]',
        ) as HTMLInputElement;
        const checkOut = document.querySelector(
          'input[name="checkOutAt"]',
        ) as HTMLInputElement;
        if (checkIn && checkOut) {
          const today = new Date()
            .toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, "-");
          setNativeValue(checkIn, `${today}T10:00`);
          setNativeValue(checkOut, `${today}T11:00`);
        }
      });

      // Button still shows error message until clicked again or reset
      // We click the button (which now has the error text) to retry
      await page.getByRole("button", { name: "確認" }).click();

      // Verify record creation (Total hours should increase)
      await expect(
        page.getByRole("heading", { name: "補正紀錄" }),
      ).toBeHidden();

      // Verify the new record in the table
      // We expect a row with the current date, "日常工作", "10:00", "11:00"
      const today = new Date().toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const row = page
        .getByRole("row", { name: new RegExp(today) })
        .filter({ hasText: "日常工作" })
        .filter({ hasText: "10:00" })
        .filter({ hasText: "11:00" });
      await expect(row).toBeVisible();
      await expect(row).toContainText("10:00");
      await expect(row).toContainText("11:00");

      // Verify Total Hours
      // Check for the stat value "1.00" in the "總服務小時" panel
      const statPanel = page.locator(".stat", { hasText: "總服務小時" });
      await expect(statPanel.locator(".stat-value")).toHaveText(/1\.00/);

      await context.close();
    });

    test("should prevent non-admin from managing casual check records", async ({
      browser,
    }) => {
      const context = await browser.newContext();
      // Login as user with NO admin roles
      await loginAs(context, []);
      const page = await context.newPage();

      // Try to visit the admin working page
      await page.goto(`/volunteer/admin/working/${testUserId}`);

      // Verify management buttons are hidden
      await expect(
        page.getByRole("button", { name: "手動日常打卡" }),
      ).toBeHidden();

      await page.waitForLoadState("networkidle");

      await expect(page.locator(".loading")).toBeHidden({ timeout: 20000 });

      // Verify the user sees a permission error
      await expect(
        page.getByText("只有管理員或本人可以進行此操作"),
      ).toBeVisible();

      await context.close();
    });
  });
