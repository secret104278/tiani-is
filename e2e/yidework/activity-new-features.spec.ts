import { expect, test } from "../fixtures";

test.describe("YideWork Activity New Features", () => {
  test("Create an 'Offering' activity with festival and filtered roles", async ({
    loginAsYideWorkAdmin,
    page,
  }) => {
    await page.goto("/yidework");

    await page.getByRole("link", { name: "建立新通知" }).click();

    // Verify "Offering" is selected by default
    await expect(page.locator('select[name="title"]')).toHaveValue("獻供通知");

    // Verify "Offering Festival" is visible
    await expect(page.getByText("獻供節日")).toBeVisible();
    await page.locator('select[name="offeringFestival"]').selectOption("初一");

    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-25T10:00");

    // Verify "Duration" (時數) is gone
    await expect(page.getByText("預估時數")).not.toBeVisible();

    // Fill filtered assignments
    const offeringSection = page.locator(
      'div:has(> label > span:text-is("獻供"))',
    );
    await offeringSection.getByPlaceholder("上首").fill("User A");
    await offeringSection.getByPlaceholder("下首").fill("User B");

    // Verify roles that should be hidden
    await expect(page.getByText("總招集")).not.toBeVisible();
    await expect(page.getByText("操持")).not.toBeVisible();

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);

    await expect(page.getByRole("heading", { name: "獻供通知" })).toBeVisible();
    await expect(page.getByText("節日：初一")).toBeVisible();
    await expect(page.getByText("上首：User A")).toBeVisible();
    await expect(page.getByText("下首：User B")).toBeVisible();

    // Verify hours is hidden in detail
    await expect(page.getByText("時數：")).not.toBeVisible();
  });

  test("Create an 'Offering' activity with 'Other' festival", async ({
    loginAsYideWorkAdmin,
    page,
  }) => {
    await page.goto("/yidework/activity/new");

    await page
      .locator('select[name="offeringFestival"]')
      .selectOption("其他（自行輸入）");
    await page
      .locator('input[name="offeringFestivalOther"]')
      .fill("自定義法會");

    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-25T10:00");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);
    await expect(page.getByText("節日：自定義法會")).toBeVisible();
  });

  test("Create a 'Ban Dao' activity hides festival and shows all roles", async ({
    loginAsYideWorkAdmin,
    page,
  }) => {
    await page.goto("/yidework/activity/new");

    await page.locator('select[name="title"]').selectOption("辦道通知");

    // Festival should be hidden
    await expect(page.getByText("獻供節日")).not.toBeVisible();

    // Preset Activity should NOT be visible (removed in working directory changes)
    await expect(page.getByText("預設活動")).not.toBeVisible();

    // All roles should be visible
    await expect(page.getByText("總招集", { exact: true })).toBeVisible();
    await expect(page.getByText("操持", { exact: true })).toBeVisible();
    await expect(page.getByText("辦道", { exact: true })).toBeVisible();

    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-25T10:00");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);
    await expect(page.getByText("時數：")).not.toBeVisible();
  });
});
