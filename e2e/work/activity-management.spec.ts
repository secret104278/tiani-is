import { expect, test } from "../fixtures";

test.describe("YideWork Activity Management", () => {
  test("Create a new standard activity", async ({ loginAsWorkAdmin, page }) => {
    await page.goto("/work/yide");

    await page.getByRole("link", { name: "建立新通知" }).click();

    await page.locator('select[name="title"]').selectOption("辦道通知");

    const bandaoSection = page.locator('div:has(> label:has-text("辦道"))');
    await bandaoSection.getByPlaceholder("上首").fill("User B");
    await bandaoSection.getByPlaceholder("下首").fill("User C");

    const dianchuanshiSection = page.locator(
      'div:has(> label:has-text("點傳師服務"))',
    );
    await dianchuanshiSection.getByPlaceholder("逗號分隔").fill("User A");

    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-25T10:00");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);

    await expect(page.getByRole("heading", { name: "辦道通知" })).toBeVisible();
    await expect(page.getByText("點傳師服務 / 講師服務")).toBeVisible();
    await expect(page.getByText("User A", { exact: true })).toBeVisible();
    await expect(page.getByText("上首：User B")).toBeVisible();
    await expect(page.getByText("下首：User C")).toBeVisible();
  });

  test("Manage activity staff", async ({
    loginAsWorkAdmin,
    createWorkActivity,
    createUser,
    page,
  }) => {
    const otherUser = await createUser();
    const targetStaff = otherUser.name!;

    const activity = await createWorkActivity(loginAsWorkAdmin.id);
    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    const staffCombobox = page.locator(
      'input[id^="headlessui-combobox-input-"]',
    );
    await staffCombobox.fill(targetStaff);
    const option = page.getByRole("option", { name: targetStaff, exact: true });
    await expect(option).toBeVisible();
    await option.click();

    await page.getByRole("button", { name: "新增", exact: true }).click();

    const staffListCheckbox = page.getByRole("checkbox");
    if (!(await staffListCheckbox.isChecked())) {
      await staffListCheckbox.click();
    }
    await expect(
      page.getByRole("listitem").filter({ hasText: targetStaff }),
    ).toBeVisible();

    await page
      .getByRole("listitem")
      .filter({ hasText: targetStaff })
      .getByRole("button")
      .click();

    await expect(page.getByText("尚無工作人員")).toBeVisible();
  });

  test("Delete an activity", async ({ loginAsWorkAdmin, page }) => {
    const uniqueTitle = `To Delete ${Date.now()}`;
    await page.goto("/work/yide");
    await page.getByRole("link", { name: "建立新通知" }).click();
    await page.locator('select[name="title"]').selectOption(["辦道通知"]);
    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-30T10:00");
    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);

    await page.getByRole("button", { name: "撤銷" }).click();

    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    await expect(page).toHaveURL("/work/yide");

    await expect(page.getByText(uniqueTitle)).not.toBeVisible();
  });
});
