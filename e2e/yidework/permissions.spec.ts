import { expect, test } from "../fixtures";

test.describe("YideWork Permissions", () => {
  test("Public read-only access", async ({
    loginAsUser,
    page,
    createYideWorkActivity,
    testYideWorkAdmin,
  }) => {
    const activity = await createYideWorkActivity(testYideWorkAdmin.id);

    // 2. Now access as regular user
    await page.goto("/yidework");

    // Filter out the '建立新通知' button
    const activityLink = page
      .getByRole("link", { name: /通知/ })
      .filter({ hasNotText: "建立" })
      .first();
    await expect(activityLink).toBeVisible();
    await activityLink.click();

    // 3. Assert activity details are visible
    await expect(page.getByRole("article")).toBeVisible();
    // Use a more generic check for activity details
    await expect(
      page.getByText("地點：").or(page.getByText("佛堂：")),
    ).toBeVisible();

    // 4. Assert management features are hidden
    await expect(page.getByRole("button", { name: "編輯" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "撤銷" })).not.toBeVisible();
    await expect(page.getByText("工作人員管理")).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "求道人清單" }),
    ).not.toBeVisible();
    // Note: '新增求道人' is visible for regular users to add their own candidates.

    // 5. Try to navigate directly to edit page
    await page.goto(`/yidework/activity/edit/${activity.id}`);

    // 6. Assert redirection or unauthorized message
    // Note: depending on implementation, it might redirect to /yidework or show an alert.
    await expect(
      page.getByText("只有管理員可以進行此操作").or(page.getByText("無權限")),
    ).toBeVisible();
  });

  test("Staff access to specific activity", async ({
    loginAsYideWorkAdmin,
    testUser,
    db,
    page,
    context,
    createYideWorkActivity,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    // 2. Add testUser as staff to this activity
    const staffCombobox = page.locator(
      'input[id^="headlessui-combobox-input-"]',
    );
    await staffCombobox.fill(testUser.name!);
    await page.getByRole("option", { name: testUser.name! }).first().click();
    await page.getByRole("button", { name: "新增", exact: true }).click();
    await expect(page.getByText("工作人員清單 (1)")).toBeVisible();

    // 3. Now log in as the regular testUser
    // We need to clear cookies and inject session for testUser
    await context.clearCookies();

    const timestamp = Date.now();
    const sessionToken = `session-staff-test-${timestamp}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await db.session.create({
      data: {
        sessionToken,
        userId: testUser.id,
        expires,
      },
    });

    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: sessionToken,
        url: "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
        expires: expires.getTime() / 1000,
      },
      {
        name: "authjs.session-token",
        value: sessionToken,
        url: "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
        expires: expires.getTime() / 1000,
      },
    ]);

    // 4. Navigate to the activity as User A
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    // 5. Assert the '求道人清單' button is visible
    await expect(page.getByRole("link", { name: "求道人清單" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "新增求道人" }),
    ).toBeVisible();

    // Cleanup session
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
  });
});
