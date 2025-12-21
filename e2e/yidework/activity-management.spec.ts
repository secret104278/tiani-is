import { expect, test } from "../fixtures";

test.describe("YideWork Activity Management", () => {
  test("Create a new standard activity", async ({
    loginAsYideWorkAdmin,
    page,
  }) => {
    // 1. Log in as a user with YIDEWORK_ADMIN role and navigate to home page
    await page.goto("/yidework");

    // 3. Click the 'Create New Notification' (建立新通知) button.
    await page.getByRole("link", { name: "建立新通知" }).click();

    // 4. Fill in the form: Select a title (default is 獻供通知), select a location (default is 天一聖道院), set start date/time, and estimated duration.
    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-25T10:00");
    await page.getByRole("spinbutton").fill("2");

    // 5. Click 'Submit' (送出).
    await page.getByRole("button", { name: "送出" }).click();

    // 6. Verify redirection to the activity detail page.
    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);

    // 7. Assert the activity title, location, and time are displayed correctly.
    await expect(page.getByRole("heading", { name: "獻供通知" })).toBeVisible();
    await expect(page.getByText("佛堂：天一聖道院")).toBeVisible();
    await expect(
      page.getByText("開始：2025/12/25 (四) 上午 10:00"),
    ).toBeVisible();

    // 8. Assert the status is 'Published' (已發佈).
    await expect(page.getByText("已發佈")).toBeVisible();
  });

  test("Create a 'Ban Dao' activity with role assignments", async ({
    loginAsYideWorkAdmin,
    page,
  }) => {
    // 1. Log in as a user with YIDEWORK_ADMIN role and navigate to home page
    await page.goto("/yidework");

    // 2. Click the '建立新通知' button
    await page.getByRole("link", { name: "建立新通知" }).click();

    // 3. Select '辦道通知' as the title.
    await page.locator('select[name="title"]').selectOption(["辦道通知"]);

    // 4. Fill in standard fields
    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-26T09:00");
    await page.getByRole("spinbutton").fill("3");

    // 5. In the Assignments (工作分配) section, fill in 'General Convener' (總招集).
    await page.getByRole("textbox").first().fill("User A");

    // 6. Fill in a dual role like 'Offering' (獻供) with Upper (上首) and Lower (下首) values.
    await page.getByRole("textbox", { name: "上首" }).first().fill("User B");
    await page.getByRole("textbox", { name: "下首" }).first().fill("User C");

    // 7. Click 'Submit'.
    await page.getByRole("button", { name: "送出" }).click();

    // 8. Verify redirection to detail page.
    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);

    // 9. Assert the assignments are displayed correctly.
    await expect(page.getByRole("heading", { name: "辦道通知" })).toBeVisible();
    await expect(page.getByText("User A")).toBeVisible();
    await expect(page.getByText("上首：User B")).toBeVisible();
    await expect(page.getByText("下首：User C")).toBeVisible();
  });

  test("Manage activity staff", async ({
    loginAsYideWorkAdmin,
    createYideWorkActivity,
    createUser,
    page,
  }) => {
    // 1. Create another user to add as staff
    const otherUser = await createUser();
    const targetStaff = otherUser.name!;

    // 2. Open a YideWork activity detail page
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    // 3. Use the user combobox to search for and select the other user.
    const staffCombobox = page.locator(
      'input[id^="headlessui-combobox-input-"]',
    );
    await staffCombobox.fill(targetStaff);
    // Wait for the option to appear and be visible to avoid clicking the input value itself
    const option = page.getByRole("option", { name: targetStaff, exact: true });
    await expect(option).toBeVisible();
    await option.click();

    // 4. Click 'Add' (新增).
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 5. Verify the user appears in the staff list.
    // The list might be in a collapse, we might need to open it.
    const staffListCheckbox = page.getByRole("checkbox");
    if (!(await staffListCheckbox.isChecked())) {
      await staffListCheckbox.click();
    }
    // Use a more specific selector for the list item to avoid strict mode violation
    await expect(
      page.getByRole("listitem").filter({ hasText: targetStaff }),
    ).toBeVisible();

    // 6. Click the delete/trash icon next to the staff member.
    await page
      .getByRole("listitem")
      .filter({ hasText: targetStaff })
      .getByRole("button")
      .click();

    // 7. Verify the user is removed from the staff list.
    await expect(page.getByText("尚無工作人員")).toBeVisible();
  });

  test("Delete an activity", async ({ loginAsYideWorkAdmin, page }) => {
    // 1. Create a unique activity to delete
    const uniqueTitle = `To Delete ${Date.now()}`;
    await page.goto("/yidework");
    await page.getByRole("link", { name: "建立新通知" }).click();
    await page.locator('select[name="title"]').selectOption(["辦道通知"]);
    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill("2025-12-30T10:00");
    await page.getByRole("spinbutton").fill("2");
    await page.getByRole("button", { name: "送出" }).click();
    await expect(page).toHaveURL(/\/yidework\/activity\/detail\/\d+/);

    // 2. Click the 'Revoke' (撤銷) button.
    await page.getByRole("button", { name: "撤銷" }).click();

    // 3. Confirm the deletion in the modal dialog.
    await page
      .getByLabel("確認撤銷")
      .getByRole("button", { name: "撤銷" })
      .click();

    // 4. Verify redirection to the YideWork home page.
    await expect(page).toHaveURL("/yidework");

    // 5. Verify the deleted activity is no longer listed.
    await expect(page.getByText(uniqueTitle)).not.toBeVisible();
  });
});
