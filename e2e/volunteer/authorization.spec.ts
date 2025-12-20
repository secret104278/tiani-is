import { VolunteerActivityStatus } from "@prisma/client";
import { expect, test } from "../fixtures";
import { setManualCheckInTimes } from "../utils/volunteer-helpers";

test.describe("Authorization and Admin Actions", () => {
  test("should prevent unauthorized access to manage activity", async ({
    page,
    loginAsUser,
    createVolunteerActivity,
    testAdmin,
  }) => {
    const activity = await createVolunteerActivity(testAdmin.id, {
      status: VolunteerActivityStatus.PUBLISHED,
    });
    await page.goto(`/volunteer/activity/detail/${activity.id}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
    await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
    await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();
  });

  test("should prevent non-manager from managing a non-published activity", async ({
    page,
    loginAsUser,
    createVolunteerActivity,
    testAdmin,
  }) => {
    // Activity created by admin, so current user (loginAsUser) is not organiser
    const inReviewActivity = await createVolunteerActivity(testAdmin.id, {
      status: VolunteerActivityStatus.INREVIEW,
    });

    await page.goto(`/volunteer/activity/detail/${inReviewActivity.id}`);

    await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
    await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
    await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();
    // Non-managers shouldn't even see INREVIEW activities if they are not organiser
    await expect(page.getByText("找不到工作")).toBeVisible();
  });

  test("should allow tiani_admin to approve an activity in INREVIEW status", async ({
    page,
    loginAsAdmin,
    createVolunteerActivity,
    testUser,
  }) => {
    // Activity created by regular user
    const inReviewActivity = await createVolunteerActivity(testUser.id, {
      status: VolunteerActivityStatus.INREVIEW,
    });

    await page.goto(`/volunteer/activity/detail/${inReviewActivity.id}`);
    await expect(page.getByText("審核中")).toBeVisible();

    await page.getByRole("button", { name: "核准" }).click();

    await expect(page.getByText("已發佈")).toBeVisible();
    await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
  });

  test("should allow manager to manage a published activity", async ({
    page,
    loginAsAdmin,
    publishedActivity,
  }) => {
    // publishedActivity is created by testUser (default in fixture)
    // loginAsAdmin is TIANI_ADMIN which has privileges

    await page.goto(`/volunteer/activity/detail/${publishedActivity.id}`);

    await expect(page.getByRole("button", { name: "編輯" })).toBeVisible();
    await expect(page.getByRole("button", { name: "撤銷" })).toBeVisible();

    await page.getByRole("button", { name: "撤銷" }).click();

    await expect(page.getByRole("heading", { name: "確認撤銷" })).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page).toHaveURL("/volunteer");
  });

  test("should prevent creating a record with invalid times", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto(`/volunteer/admin/working/${testUser.id}`);
    await expect(page.getByText(testUser.name!)).toBeVisible();

    await page.getByRole("button", { name: "手動日常打卡" }).click();
    await expect(page.getByRole("heading", { name: "補正紀錄" })).toBeVisible();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayInput = `${year}-${month}-${day}`;

    // Invalid: Check-in after check-out
    await setManualCheckInTimes(
      page,
      `${todayInput}T23:00`,
      `${todayInput}T10:00`,
    );

    await page.getByRole("button", { name: "確認" }).click();

    await expect(
      page.getByRole("button", { name: "簽退時間必須晚於簽到時間" }),
    ).toBeVisible();
  });

  test("should allow admin to manage casual check records", async ({
    page,
    loginAsAdmin,
    testUser,
  }) => {
    await page.goto(`/volunteer/admin/working/${testUser.id}`);
    await expect(page.getByText(testUser.name!)).toBeVisible();

    await page.getByRole("button", { name: "手動日常打卡" }).click();
    await expect(page.getByRole("heading", { name: "補正紀錄" })).toBeVisible();

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

    await expect(page.getByRole("heading", { name: "補正紀錄" })).toBeHidden();

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
  });

  test("should prevent non-admin from managing casual check records", async ({
    page,
    loginAsUser,
    createUser,
  }) => {
    const otherUser = await createUser([]);
    await page.goto(`/volunteer/admin/working/${otherUser.id}`);

    await expect(
      page.getByRole("button", { name: "手動日常打卡" }),
    ).toBeHidden();

    await page.waitForLoadState("networkidle");
    await expect(page.locator(".loading")).toBeHidden({ timeout: 20000 });

    await expect(
      page.getByText("只有管理員或本人可以進行此操作"),
    ).toBeVisible();
  });
});
