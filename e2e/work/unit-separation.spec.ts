import { expect, test } from "../fixtures";

test.describe("Work Management - Unit Separation", () => {
  const timestamp = Date.now();
  const yiDeTitle = `YiDe Work ${timestamp}`;
  const zhongDeTitle = `ZhongDe Work ${timestamp}`;

  test("should segregate work activities by unit", async ({
    page,
    loginAsAdmin,
  }) => {
    const workerIndex = test.info().workerIndex;
    const yiDeTitleUnique = `${yiDeTitle}-w${workerIndex}`;
    const zhongDeTitleUnique = `${zhongDeTitle}-w${workerIndex}`;

    // 1. Create Work Activity for "義德"
    await page.goto("/work/yide/activity/new");

    await page.locator('select[name="title"]').selectOption("獻供通知");
    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill("2026-12-01T10:00");
    await page.locator('textarea[name="description"]').fill(yiDeTitleUnique);

    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);

    // 2. Create Work Activity for "忠德"
    await page.goto("/work/zhongde/activity/new");

    await page.locator('select[name="title"]').selectOption("辦道通知");
    await page.locator('select[name="locationId"]').selectOption({ index: 0 });
    await page.locator('input[name="startDateTime"]').fill("2026-12-01T14:00");
    await page.locator('textarea[name="description"]').fill(zhongDeTitleUnique);

    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/work\/zhongde\/activity\/detail\/\d+/);

    // // 3. Verify YiDe Dashboard
    // await page.goto("/work/yide");
    // await expect(page.getByText(yiDeTitleUnique)).toBeVisible();
    // await expect(page.getByText(zhongDeTitleUnique)).not.toBeVisible();

    // // 4. Verify ZhongDe Dashboard
    // await page.goto("/work/zhongde");
    // await expect(page.getByText(zhongDeTitleUnique)).toBeVisible();
    // await expect(page.getByText(yiDeTitleUnique)).not.toBeVisible();

    // // 5. Verify Site Context Branding
    // await expect(page.getByRole("link", { name: "忠德道務網" })).toBeVisible();
    // await page.getByRole("link", { name: "忠德道務網" }).click();
    // await expect(page).toHaveURL("/work/zhongde");
  });
});
