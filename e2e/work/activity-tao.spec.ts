import { expect, test } from "../fixtures";

function getUniqueId() {
  return Math.random().toString(36).substring(2, 9);
}

test.describe("Tao Activity Specific Features", () => {
  test("Tao activity UI layout and collapse behavior", async ({
    loginAsWorkAdmin,
    createWorkActivity,
    page,
  }) => {
    const activity = await createWorkActivity(loginAsWorkAdmin.id, {
      title: "辦道通知",
      description: `Tao Collapse ${getUniqueId()}`,
      assignments: { generalConvener: "張三" }, // Add some assignment to make the section visible
    });

    await page.goto(`/work/yide/activity/detail/${activity.id}`);

    // 1. Verify "我要帶人來求道" button is visible
    await expect(
      page.getByRole("button", { name: "我要帶人來求道" }),
    ).toBeVisible();

    // 2. Verify assignments section is present but the content (e.g. "總招集") is not visible initially
    // Because it's wrapped in a DaisyUI collapse
    const assignmentTitle = page.locator(".collapse-title", {
      hasText: "工作分配",
    });
    await expect(assignmentTitle).toBeVisible();

    const roleLabel = page.getByText("總招集", { exact: true });
    // In Playwright, if an element is hidden via CSS (e.g. collapse content), toBeVisible() will be false
    await expect(roleLabel).not.toBeVisible();

    // 3. Click to expand
    // Use force: true because the checkbox might intercept the click
    await assignmentTitle.click({ force: true });
    await expect(roleLabel).toBeVisible();

    // 4. Verify "Staff Management" (工作人員管理) IS visible for Tao activity (unlike Ceremony)
    await expect(page.getByText("工作人員管理")).toBeVisible();
  });
});
