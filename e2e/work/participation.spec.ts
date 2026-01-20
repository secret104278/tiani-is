import { expect, test } from "../fixtures";

function getUniqueId() {
  return Math.random().toString(36).substring(2, 9);
}

test.describe("Work Participation Flow", () => {
  test("Participation with Specific Role (Ban Dao)", async ({
    loginAsUser,
    createWorkActivity,
    page,
  }) => {
    const uniqueDesc = `BanDao ${getUniqueId()}`;
    const activity = await createWorkActivity(loginAsUser.id, {
      title: "辦道通知",
      description: uniqueDesc,
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    // 1. Verify button text
    const participateBtn = page.getByRole("button", {
      name: "我可以參與幫辦",
    });
    await expect(participateBtn).toBeVisible();

    // 2. Open dialog
    await participateBtn.click();

    // 3. Select Role (Ban Dao -> Cao Chi)
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("操持").check();

    // 4. Submit
    await dialog.getByRole("button", { name: "我要幫辦" }).click();

    // 5. Assertions
    await expect(dialog).not.toBeVisible();

    // The "工作分配" section should show the user's name under "操持"
    const assignmentsSection = page.locator(".divider", { hasText: "工作分配" }).locator("..");
    await expect(assignmentsSection.getByText("操持")).toBeVisible();
    await expect(assignmentsSection.getByRole("paragraph").filter({ hasText: new RegExp(`^${loginAsUser.name!}$`) })).toBeVisible();
    
    // Check staff list dropdown/section
    await expect(page.getByRole("button", { name: /取消參加/ })).toBeVisible();
  });


  test("Participation with 'Flexible' Option (Ban Dao)", async ({
    loginAsUser,
    createWorkActivity,
    page,
  }) => {
    const activity = await createWorkActivity(loginAsUser.id, {
      title: "辦道通知",
      description: `Flexible ${getUniqueId()}`,
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    await page.getByRole("button", { name: "我可以參與幫辦" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("配合安排").check();
    await dialog.getByRole("button", { name: "參加" }).click();

    await expect(dialog).not.toBeVisible();

    // User should be visible in the page somewhere (e.g. Cancel button means joined)
    await expect(page.getByRole("button", { name: "取消參加" })).toBeVisible();
    
    const assignmentsSection = page.locator(".divider", { hasText: "工作分配" }).locator("..");
    // Assignments should be empty (User's name is NOT added to any specific role)
    await expect(assignmentsSection.getByText(loginAsUser.name!)).not.toBeVisible();
  });

  test("Participation Flow (Offering)", async ({
    loginAsUser,
    createWorkActivity,
    page,
  }) => {
    const activity = await createWorkActivity(loginAsUser.id, {
      title: "獻供通知",
      description: `Offering ${getUniqueId()}`,
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    // 1. Verify button text
    const participateBtn = page.getByRole("button", { name: "我可以參加" });
    await expect(participateBtn).toBeVisible();

    // 2. Submit simplified dialog
    await participateBtn.click();
    const dialog = page.getByRole("dialog");
    // For offering, roles are filtered. But we just click confirm if we want to join.
    // We need to select something or just click if "配合安排" is enough.
    await dialog.getByLabel("配合安排").check();
    await dialog.getByRole("button", { name: "參加" }).click();

    // 3. Assertions
    await expect(page.getByRole("button", { name: "取消參加" })).toBeVisible();
  });

  test("Automatic Cleanup on Leave", async ({
    loginAsUser,
    createWorkActivity,
    page,
  }) => {
    const activity = await createWorkActivity(loginAsUser.id, {
      title: "辦道通知",
      description: `Cleanup ${getUniqueId()}`,
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    // Join and assign to "表文"
    await page.getByRole("button", { name: "我可以參與幫辦" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("表文").check();
    await dialog.getByRole("button", { name: "我要幫辦" }).click();

    const assignmentsSection = page.locator(".divider", { hasText: "工作分配" }).locator("..");
    await expect(assignmentsSection.getByRole("paragraph").filter({ hasText: new RegExp(`^${loginAsUser.name!}$`) })).toBeVisible();

    // Cancel
    await page.getByRole("button", { name: "取消參加" }).click();
    
    // Assert removal
    await expect(assignmentsSection.getByRole("paragraph").filter({ hasText: new RegExp(`^${loginAsUser.name!}$`) })).not.toBeVisible();
  });

  test("Suggestive Input (Admin Editor)", async ({
    loginAsWorkAdmin,
    createWorkActivity,
    createUser,
    page,
  }) => {
    const testUser = await createUser();
    const activity = await createWorkActivity(loginAsWorkAdmin.id, {
      title: "辦道通知",
      description: `Suggestive ${getUniqueId()}`,
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    // 1. Add Test User A to staff list
    const staffCombobox = page.locator('input[id^="headlessui-combobox-input-"]');
    await staffCombobox.fill(testUser.name!);
    await page.getByRole("option", { name: testUser.name!, exact: true }).first().click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 2. Go to Edit page
    await page.getByRole("link", { name: "編輯" }).click();

    // 3. Check Suggestive Input
    // "總招集" field
    const zongZhaoji = page.locator('div:has(> label:has-text("總招集"))').locator('input');
    await zongZhaoji.focus();
    // Type first char
    await zongZhaoji.pressSequentially(testUser.name!.substring(0, 1));
    
    // Should suggest the user in datalist
    const datalistId = await zongZhaoji.getAttribute("list");
    await expect(
      page.locator(`datalist[id="${datalistId}"] option[value="${testUser.name!}"]`),
    ).toBeAttached();
    
    // 4. Manual name works
    const manualName = `Manual ${getUniqueId()}`;
    await zongZhaoji.fill(manualName);
    await page.getByRole("button", { name: "送出" }).click();
    
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\//);
    await expect(page.getByText("總招集")).toBeVisible();
    await expect(page.getByText(manualName)).toBeVisible();
  });
});
