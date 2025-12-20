import { expect, test } from "../fixtures";

test.describe("Personal Account - Unit Selector", () => {
  test.beforeEach(async ({ page, loginAsUser }) => {
    await page.goto("/personal/account");
  });

  test("should allow standard hierarchical selection", async ({
    page,
    loginAsUser,
  }) => {
    // Scroll to section
    await page
      .getByRole("heading", { name: "求道卡資料" })
      .scrollIntoViewIfNeeded();

    // Level 1: "總單位"
    const l1 = page.locator('select:has(option:has-text("總單位"))');
    await expect(l1).toBeVisible();
    await l1.selectOption("基礎忠恕");

    // Level 2: "次級單位"
    const l2 = page.locator('select:has(option:has-text("次級單位"))');
    await expect(l2).toBeVisible();
    await l2.selectOption("瑞周");

    // Level 3: "下級單位"
    const l3 = page.locator('select:has(option:has-text("下級單位"))');
    await expect(l3).toBeVisible();
    await l3.selectOption("天惠");

    // Level 4: "單位"
    const l4 = page.locator('select:has(option:text-is("單位"))');
    await expect(l4).toBeVisible();
    await l4.selectOption("義德");
  });

  test("should have 'Other' option in L1, L2, and L3", async ({
    page,
    loginAsUser,
  }) => {
    await page
      .getByRole("heading", { name: "求道卡資料" })
      .scrollIntoViewIfNeeded();

    const l1 = page.locator('select:has(option:has-text("總單位"))');
    await l1.selectOption("基礎忠恕");

    const l2 = page.locator('select:has(option:has-text("次級單位"))');
    await expect(l2).toBeVisible();
    const l2Options = await l2.locator("option").allInnerTexts();
    expect(l2Options).toContain("其他");

    await l2.selectOption("瑞周");

    const l3 = page.locator('select:has(option:has-text("下級單位"))');
    await expect(l3).toBeVisible();
    const l3Options = await l3.locator("option").allInnerTexts();
    expect(l3Options).toContain("其他");

    await l3.selectOption("天惠");

    const l4 = page.locator('select:has(option:text-is("單位"))');
    await expect(l4).toBeVisible();
    const l4Options = await l4.locator("option").allInnerTexts();
    expect(l4Options).not.toContain("其他");
  });

  test("should support custom input when 'Other' is selected at Level 1", async ({
    page,
    loginAsUser,
  }) => {
    await page
      .getByRole("heading", { name: "求道卡資料" })
      .scrollIntoViewIfNeeded();

    const l1 = page.locator('select:has(option:has-text("總單位"))');
    await l1.selectOption("Other");

    const customInput = page.getByPlaceholder("輸入完整單位名稱");
    await expect(customInput).toBeVisible();

    await expect(
      page.locator('select:has(option:has-text("次級單位"))'),
    ).toBeVisible();
    await expect(
      page.locator('select:has(option:has-text("下級單位"))'),
    ).not.toBeVisible();

    await customInput.fill("My Custom Unit");
    await expect(customInput).toHaveValue("My Custom Unit");

    await l1.selectOption("基礎忠恕");
    await expect(customInput).not.toBeVisible();
    await expect(
      page.locator('select:has(option:has-text("次級單位"))'),
    ).toBeVisible();

    await l1.selectOption("Other");
    await expect(customInput).toBeVisible();
    await expect(customInput).toHaveValue("");
  });

  test("should support custom input when 'Other' is selected at Level 2", async ({
    page,
    loginAsUser,
  }) => {
    await page
      .getByRole("heading", { name: "求道卡資料" })
      .scrollIntoViewIfNeeded();

    const l1 = page.locator('select:has(option:has-text("總單位"))');
    await l1.selectOption("基礎忠恕");

    const l2 = page.locator('select:has(option:has-text("次級單位"))');
    await expect(l2).toBeVisible();
    await l2.selectOption("Other");

    const customL2Input = page.getByPlaceholder("輸入次級單位名稱");
    await expect(customL2Input).toBeVisible();

    await expect(
      page.locator('select:has(option:has-text("下級單位"))'),
    ).toBeVisible();

    await customL2Input.fill("Custom L2");
    await expect(customL2Input).toHaveValue("Custom L2");

    await l2.selectOption("瑞周");
    await expect(customL2Input).not.toBeVisible();
  });

  test("should support custom input when 'Other' is selected at Level 3", async ({
    page,
    loginAsUser,
  }) => {
    await page
      .getByRole("heading", { name: "求道卡資料" })
      .scrollIntoViewIfNeeded();

    const l1 = page.locator('select:has(option:has-text("總單位"))');
    await l1.selectOption("基礎忠恕");

    const l2 = page.locator('select:has(option:has-text("次級單位"))');
    await l2.selectOption("瑞周");

    const l3 = page.locator('select:has(option:has-text("下級單位"))');
    await expect(l3).toBeVisible();
    await l3.selectOption("Other");

    const customL3Input = page.getByPlaceholder("輸入下級單位名稱");
    await expect(customL3Input).toBeVisible();

    await expect(
      page.locator('select:has(option:text-is("單位"))'),
    ).toBeVisible();

    await customL3Input.fill("Custom L3");
    await expect(customL3Input).toHaveValue("Custom L3");

    await l3.selectOption("天惠");
    await expect(customL3Input).not.toBeVisible();
  });
});
