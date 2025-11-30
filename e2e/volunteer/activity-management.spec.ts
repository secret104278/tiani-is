import { type Page, expect, test } from "@playwright/test";

test.describe("Volunteer Activity Management", () => {
  // Helper to create activity
  async function createActivity(page: Page, isDraft = false) {
    await page.goto("/volunteer/activity/new");
    // Select topic. 1 = "園藝維護"
    await page.locator('select[name="title"]').selectOption({ index: 1 });
    await page.fill('input[name="headcount"]', "5");

    const uniqueLocation = `Test Location ${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await page.fill('input[name="location"]', uniqueLocation);

    // Set start time to 1 hour later
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}T${hours}:${minutes}`;

    await page.fill('input[name="startDateTime"]', dateString);
    await page.fill('input[name="duration"]', "2");
    await page.fill('textarea[name="description"]', "Test Description");

    if (isDraft) {
      await page.getByRole("button", { name: "保存草稿" }).click();
    } else {
      await page.getByRole("button", { name: "送出" }).click();
    }

    // Wait for navigation to detail page
    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

    // Extract ID from URL
    const url = page.url();
    const id = url.split("/").pop();

    return { id, uniqueLocation };
  }

  test("should create a new activity", async ({ page }) => {
    await page.goto("/volunteer");
    await page.getByRole("link", { name: "建立新工作" }).click();
    await expect(page).toHaveURL("/volunteer/activity/new");

    await page.locator('select[name="title"]').selectOption({ index: 1 });
    await page.fill('input[name="headcount"]', "5");
    await page.fill('input[name="location"]', "Test Location New");

    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}T${hours}:${minutes}`;
    await page.fill('input[name="startDateTime"]', dateString);

    await page.fill('input[name="duration"]', "2");
    await page.fill('textarea[name="description"]', "Description New");
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);
    await expect(page.getByText("Test Location New")).toBeVisible();
    await expect(page.getByText("Description New")).toBeVisible();
  });

  test("should approve an activity", async ({ page }) => {
    // 1.2
    await createActivity(page, true); // Create Draft
    await page.getByRole("button", { name: "送出申請" }).click(); // Submit for review -> INREVIEW

    // As TIANI_ADMIN (default test user), I can approve
    await expect(page.getByRole("button", { name: "核准" })).toBeVisible();
    await page.getByRole("button", { name: "核准" }).click();

    // Verify success. Status badge changes to "已發佈" (PUBLISHED)
    await expect(page.getByText("已發佈")).toBeVisible();
    await expect(page.getByRole("button", { name: "核准" })).toBeHidden();
  });

  test("should edit an activity", async ({ page }) => {
    // 1.3
    const { id } = await createActivity(page);
    await page.getByRole("button", { name: "編輯" }).click();
    await expect(page).toHaveURL(`/volunteer/activity/edit/${id}`);

    const newLocation = `Updated Location ${Date.now()}`;
    await page.fill('input[name="location"]', newLocation);
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(`/volunteer/activity/detail/${id}`);
    await expect(page.getByText(newLocation)).toBeVisible();
  });

  test("should revoke an activity", async ({ page }) => {
    // 1.4
    const { id } = await createActivity(page);
    await page.getByRole("button", { name: "撤銷" }).click();

    await expect(page.getByText("確認撤銷")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "撤銷", exact: true })
      .click();

    await expect(page).toHaveURL("/volunteer");

    // Verify it's not accessible or shows "404"
    await page.goto(`/volunteer/activity/detail/${id}`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("should update activity details successfully", async ({ page }) => {
    // 1.5
    const { id } = await createActivity(page);
    await page.getByRole("button", { name: "編輯" }).click();

    const newLoc = `New Loc ${Date.now()}`;
    const newDesc = `New Desc ${Date.now()}`;

    await page.fill('input[name="location"]', newLoc);
    await page.fill('textarea[name="description"]', newDesc);
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(`/volunteer/activity/detail/${id}`);
    await expect(page.getByText(newLoc)).toBeVisible();
    await expect(page.getByText(newDesc)).toBeVisible();
  });

  test("should submit a draft activity for review", async ({ page }) => {
    // 1.6
    await createActivity(page, true); // Create Draft

    // Check status badge "草稿" (DRAFT)
    await expect(page.getByText("草稿")).toBeVisible();

    await page.getByRole("button", { name: "送出申請" }).click();

    // Check status "審核中" (INREVIEW)
    await expect(page.getByText("審核中")).toBeVisible();
    await expect(page.getByRole("button", { name: "送出申請" })).toBeHidden();
  });

  test("should filter activities in list view", async ({ page }) => {
    // 1.7
    const { uniqueLocation } = await createActivity(page);
    await page.goto("/volunteer");

    // Filter by "My Initiated"
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("volunteerActivity.getAllActivitiesInfinite") &&
        response.status() === 200,
    );
    await page.getByLabel("我發起的").check();
    await responsePromise;

    // Give UI a moment to re-render
    await page.waitForTimeout(1000);

    // Scroll down to ensure item is in view (Mobile Safari quirk?)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check if our activity is visible
    const escapedLocation = uniqueLocation.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    await expect(page.getByText(new RegExp(escapedLocation))).toBeVisible();

    // Verify unticking also shows it (since it's ours)
    await page.getByLabel("我發起的").uncheck();
    // Wait for refetch
    await expect(
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes("volunteerActivity.getAllActivitiesInfinite") &&
          response.status() === 200,
      ),
    ).resolves.toBeTruthy();

    await expect(page.getByText(new RegExp(escapedLocation))).toBeVisible();
  });
});
