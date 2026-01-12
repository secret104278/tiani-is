import { expect, test } from "../fixtures";

test.describe("YideWork Permissions", () => {
  test("Public read-only access", async ({
    loginAsUser,
    page,
    createWorkActivity,
    testWorkAdmin,
  }) => {
    const activity = await createWorkActivity(testWorkAdmin.id);

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    await expect(
      page.getByText("地點：").or(page.getByText("佛堂：")),
    ).toBeVisible();
    await expect(
      page.getByRole("article").filter({ hasText: "Test Description" }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "編輯" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "撤銷" })).not.toBeVisible();
    await expect(page.getByText("工作人員管理")).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "求道人清單" }),
    ).not.toBeVisible();

    await page.goto(`/work/yide/activity/edit/${activity.id}`);

    await expect(
      page.getByText("只有管理員可以進行此操作").or(page.getByText("無權限")),
    ).toBeVisible();
  });

  test("Staff access to specific activity", async ({
    loginAsWorkAdmin,
    testUser,
    db,
    page,
    createWorkActivity,
    switchUser,
  }) => {
    const activity = await createWorkActivity(loginAsWorkAdmin.id);
    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    const staffCombobox = page.locator(
      'input[id^="headlessui-combobox-input-"]',
    );
    await staffCombobox.fill(testUser.name!);
    await page.getByRole("option", { name: testUser.name! }).first().click();
    await page.getByRole("button", { name: "新增", exact: true }).click();
    await expect(page.getByText("工作人員清單 (1)")).toBeVisible();

    await switchUser(testUser.id);

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    await expect(page.getByRole("link", { name: "求道人清單" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "我要帶人來求道" }),
    ).toBeVisible();
  });
});
