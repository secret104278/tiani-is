import { expect, test } from "../fixtures";

test.describe("Class Management - Unit Separation", () => {
  const timestamp = Date.now();
  const yiDeTitle = `YiDe Activity ${timestamp}`;
  const xinDeTitle = `XinDe Activity ${timestamp}`;

  test("should segregate activities by unit", async ({ page, loginAsAdmin }) => {
    // Use worker ID to avoid conflicts in parallel runs
    const workerIndex = test.info().workerIndex;
    const yiDeTitleUnique = `${yiDeTitle}-w${workerIndex}`;
    const xinDeTitleUnique = `${xinDeTitle}-w${workerIndex}`;

    // 1. Create Activity for "義德"
    await page.goto("/yideclass/activity/new");
    await page.locator('select[name="unit"]').selectOption("義德");
    await page.locator('select[name="title"]').selectOption("自行輸入");
    await page.locator('input[name="titleOther"]').fill(yiDeTitleUnique);
    await page.locator('select[name="location"]').selectOption({ index: 0 });

    const dateString = "2026-12-01T10:00";
    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "1");
    
    // Submit using standard form submission logic
    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/yideclass\/activity\/detail\/\d+/, { timeout: 30000 });

    // 2. Create Activity for "信德"
    await page.goto("/yideclass/activity/new");
    await page.locator('select[name="unit"]').selectOption("信德");
    await page.locator('select[name="title"]').selectOption("自行輸入");
    await page.locator('input[name="titleOther"]').fill(xinDeTitleUnique);
    await page.locator('select[name="location"]').selectOption({ index: 0 });
    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "1");

    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/yideclass\/activity\/detail\/\d+/, { timeout: 30000 });

    // 3. Visit YiDe Dashboard
    await page.goto("/yideclass");
    await page.getByRole("link", { name: "義德", exact: true }).click();
    await expect(page).toHaveURL(/\/yideclass\/.*/);
    
    await expect(page.getByText(yiDeTitleUnique)).toBeVisible();
    await expect(page.getByText(xinDeTitleUnique)).not.toBeVisible();

    // 4. Visit XinDe Dashboard
    await page.goto("/yideclass");
    await page.getByRole("link", { name: "信德", exact: true }).click();
    await expect(page).toHaveURL(/\/yideclass\/.*/);

    await expect(page.getByText(xinDeTitleUnique)).toBeVisible();
    await expect(page.getByText(yiDeTitleUnique)).not.toBeVisible();
  });
});
