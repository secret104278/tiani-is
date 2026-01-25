import { expect, test } from "../fixtures";

test.describe("Work Activity - Edit Mode Regression", () => {
  test("should NOT reset assignments when editing without changing title", async ({
    page,
    loginAsWorkAdmin,
    createWorkActivity,
  }) => {
    // 1. Arrange: Create an activity with specific assignments
    // We assign "User A" to "Offering (Upper)" to see if it persists
    const assignmentName = "User A";
    const activity = await createWorkActivity(loginAsWorkAdmin.id, {
      title: "獻供通知",
      assignments: {
        offering: {
          upper: assignmentName,
        },
      },
      // Ensure rolesConfig is set so the field is visible
      rolesConfig: ["offering"], 
    });

    // 2. Act: Go to the Edit page
    await page.goto(`/work/yide/activity/edit/${activity.id}`);

    // 3. Assert: Verify the assignment is loaded correctly (Initial State)
    const upperInput = page.locator('div:has-text("獻供執禮")').getByPlaceholder("上首").first();
    await expect(upperInput).toBeVisible();
    await expect(upperInput).toHaveValue(assignmentName);

    // 4. Act: Interact with the Title dropdown
    // We explicitly re-select the SAME title ("獻供通知").
    // Without the fix, this might trigger the onChange handler and reset the assignments.
    const titleSelect = page.locator('select[name="title"]');
    await titleSelect.selectOption("獻供通知");

    // 5. Assert: Verify the assignment is STILL there after interaction
    await expect(upperInput).toHaveValue(assignmentName);

    // 6. Act: Save the form
    await page.getByRole("button", { name: "送出" }).click();

    // 7. Assert: Verify we are redirected to Detail page and data persists
    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByText(`上首：${assignmentName}`)).toBeVisible();
  });
});
