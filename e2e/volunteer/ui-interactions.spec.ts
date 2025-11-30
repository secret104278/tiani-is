import { expect, test } from "@playwright/test";

test.describe("UI Interactions and Edge Cases", () => {
  test("should handle non-existent activity gracefully", async ({ page }) => {
    // 5.1 & 5.4: Navigate to non-existent activity
    await page.goto("/volunteer/activity/detail/99999");

    // Verify 404 page is displayed
    // "This page could not be found" is the standard Next.js 404 message observed
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });

  test("should display correct UI elements and confirmation dialogs", async ({
    page,
  }) => {
    // Setup: Create a new activity to work with
    await page.goto("/volunteer/activity/new");
    await page.locator('select[name="title"]').selectOption({ index: 1 });
    await page.fill('input[name="headcount"]', "5");

    const uniqueLocation = `Test Location UI ${Date.now()}`;
    await page.fill('input[name="location"]', uniqueLocation);

    // Set future date
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const offset = now.getTimezoneOffset() * 60000;
    const dateString = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    await page.fill('input[name="startDateTime"]', dateString);

    await page.fill('input[name="duration"]', "2");
    await page.fill('textarea[name="description"]', "UI Test Description");

    // Submit (Create) -> Goes to INREVIEW status for this user
    await page.getByRole("button", { name: "送出" }).click();

    // Wait for navigation to detail page
    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

    // 5.2: Verify INREVIEW elements
    // "審核中" status should be visible
    await expect(page.getByText("審核中")).toBeVisible();
    // "核准" (Approve) button should be visible for admin
    await expect(page.getByRole("button", { name: "核准" })).toBeVisible();

    // Approve it to transition to PUBLISHED
    await page.getByRole("button", { name: "核准" }).click();

    // Verify PUBLISHED elements
    await expect(page.getByText("已發佈")).toBeVisible();
    // "分享至Line" button should be visible
    await expect(
      page.getByRole("button", { name: "分享至Line" }),
    ).toBeVisible();

    // 5.3: Verify Confirmation Dialogs
    // The creator is automatically a participant, so "取消報名" (Cancel Registration) should be visible
    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();

    // Click Cancel Registration to trigger dialog
    await page.getByRole("button", { name: "取消報名" }).click();

    // Verify "取消報名" Dialog appears
    await expect(page.getByText("確定要取消報名嗎？")).toBeVisible();

    // Click "取消" (Cancel) in the dialog
    // We target the button with exact text "取消"
    await page.getByRole("button", { name: "取消", exact: true }).click();

    // Verify Dialog is closed
    await expect(page.getByText("確定要取消報名嗎？")).toBeHidden();

    // Click "撤銷" (Revoke) to trigger dialog
    await page.getByRole("button", { name: "撤銷" }).click();

    // Verify "確認撤銷" Dialog appears
    await expect(page.getByRole("heading", { name: "確認撤銷" })).toBeVisible();

    // Click "撤銷" (Confirm) inside the dialog
    // We scope to the dialog to avoid clicking the trigger button
    // The dialog usually has the role "dialog" or we can rely on the confirm button text logic
    // Using simple locator strategy based on the observation that the dialog is active
    // The confirm button in the ConfirmDialog component has text "撤銷"
    // Since there might be two "撤銷" buttons (trigger and confirm), we pick the last one or scope it
    const revokeButtons = page.getByRole("button", { name: "撤銷" });
    const count = await revokeButtons.count();
    // Click the last one which should be the one in the modal (rendered later)
    await revokeButtons.nth(count - 1).click();

    // Verify redirection to list page, indicating successful revocation/deletion
    await expect(page).toHaveURL("/volunteer");
  });
});
