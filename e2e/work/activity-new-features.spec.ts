import { addDays, format } from "date-fns";
import { expect, test } from "../fixtures";

test.describe("YideWork Activity New Features", () => {
  const futureDate = addDays(new Date(), 7);
  const futureDateIso = format(futureDate, "yyyy-MM-dd'T'10:00");
  const futureDateDisplay = format(futureDate, "yyyy/MM/dd");

  test("Create an 'Offering' activity with festival and filtered roles", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    await page.goto("/work/yide");

    await page.getByRole("link", { name: "建立新通知" }).click();

    // Verify "Offering" is selected by default
    await expect(page.locator('select[name="title"]')).toHaveValue("獻供通知");

    // Verify "Offering Festival" is visible
    await expect(page.getByText("獻供節日")).toBeVisible();
    await page.locator('select[name="offeringFestival"]').selectOption("初一");

    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);

    // Verify "Duration" (時數) is gone
    await expect(page.getByText("預估時數")).not.toBeVisible();

    // Fill custom assignments
    await page.getByRole("button", { name: "新增自訂欄位" }).click();
    await page
      .locator('input[placeholder="職務 (如: 獻供上執禮)"]')
      .fill("獻供執禮");
    await page.locator('input[placeholder="人員姓名"]').fill("User A, User B");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByRole("heading", { name: "獻供通知" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "我可以參與幫辦" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "我可以參與幫辦" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("選擇您要學習的項目")).toBeVisible();
    await dialog.getByLabel("獻供上執禮").check();
    await dialog.getByRole("button", { name: "我可以參與幫辦" }).click();

    await expect(
      page.getByRole("button", { name: "修改幫辦項目" }),
    ).toBeVisible();

    await expect(page.getByText("節日：初一")).toBeVisible();
    await expect(page.getByText("獻供執禮")).toBeVisible();
    await expect(page.getByText("User A, User B")).toBeVisible();

    // Verify lunar date and time display
    await expect(page.getByText("國曆：")).toBeVisible();

    // Verify original staff management is hidden for Offering
    await expect(page.getByText("工作人員管理")).not.toBeVisible();

    // Verify hours is hidden in detail
    await expect(page.getByText("時數：")).not.toBeVisible();
  });

  test("Offering activity staff list visibility (Admin vs User)", async ({
    loginAsWorkAdmin,
    testUser,
    switchUser,
    page,
  }) => {
    // 1. Create an offering activity as Admin
    await page.goto("/work/yide/activity/new");
    await page.locator('select[name="title"]').selectOption("獻供通知");
    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);
    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    const activityUrl = page.url();

    // Admin should see staff list (even if empty)
    await expect(page.getByText(/參與人員清單/)).toBeVisible();

    // 2. Switch to normal user
    await switchUser(testUser.id);
    await page.goto(activityUrl);

    // Normal user should NOT see staff list
    await expect(page.getByText(/參與人員清單/)).not.toBeVisible();

    // Normal user should see "I want to participate"
    await expect(
      page.getByRole("button", { name: "我可以參與幫辦" }),
    ).toBeVisible();
  });

  test("Create a 'Ban Dao' activity hides festival and shows lunar/time info", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    await page.goto("/work/yide/activity/new");

    await page.locator('select[name="title"]').selectOption("辦道通知");

    // Festival should be hidden
    await expect(page.getByText("獻供節日")).not.toBeVisible();

    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);

    // Verify lunar and traditional time display for "Ban Dao"
    await expect(page.getByText(`國曆：${futureDateDisplay}`)).toBeVisible();
    await expect(page.getByText("農曆：")).toBeVisible();
    await expect(page.getByText("時")).toBeVisible(); // Twelve hours (時辰) label

    // Verify staff management is visible for Ban Dao
    await expect(page.getByText("工作人員管理")).toBeVisible();
  });

  test("Create an 'Offering' activity with 'Other' festival", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    await page.goto("/work/yide/activity/new");

    await page
      .locator('select[name="offeringFestival"]')
      .selectOption("其他（自行輸入）");
    await page
      .locator('input[name="offeringFestivalOther"]')
      .fill("自定義法會");

    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByText("節日：自定義法會")).toBeVisible();
  });

  test("Create a 'Ban Dao' activity hides festival and shows all roles", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    await page.goto("/work/yide/activity/new");

    await page.locator('select[name="title"]').selectOption("辦道通知");

    // Festival should be hidden
    await expect(page.getByText("獻供節日")).not.toBeVisible();

    // Preset Activity should NOT be visible (removed in working directory changes)
    await expect(page.getByText("預設活動")).not.toBeVisible();

    // Fill custom assignments
    await page.getByRole("button", { name: "新增自訂欄位" }).click();
    await page
      .locator('input[placeholder="職務 (如: 獻供上執禮)"]')
      .fill("總招集");
    await page.locator('input[placeholder="人員姓名"]').fill("張三");

    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByText("時數：")).not.toBeVisible();
  });
});
