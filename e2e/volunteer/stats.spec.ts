import { expect, test } from "../fixtures";

test.describe("Volunteer Stats", () => {
  test("should display working stats", async ({
    page,
    loginAsUser,
    createVolunteerActivity,
    testUser,
  }) => {
    // 1. Setup Initial Casual Work Data
    await page.goto("/volunteer");
    const casualCard = page.locator(".card", { hasText: "日常工作" });

    // Perform Casual Check-In
    const checkInPromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.casualCheckIn") &&
        res.status() === 200,
    );
    await casualCard.getByRole("button", { name: /簽到|再次簽到/ }).click();
    // Use expect() correctly and wait for inner content to bypass transition lag
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    const punchButton = page
      .getByRole("button")
      .filter({ hasText: /打卡|定位中|超出範圍/ });
    // Wait longer for positioning to finish
    await expect(punchButton).toHaveText("打卡", { timeout: 20000 });
    await punchButton.click();
    await checkInPromise;

    // Perform Casual Check-Out
    const checkOutPromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.casualCheckIn") &&
        res.status() === 200,
    );
    await casualCard.getByRole("button", { name: "簽退" }).click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await checkOutPromise;

    // 2. Setup Activity Data
    const activity = await createVolunteerActivity(testUser.id);
    const activityTitle = activity.title;
    await page.goto(`/volunteer/activity/detail/${activity.id}`);

    await page.getByRole("button", { name: "報名" }).click();
    await expect(page.getByText("已報名")).toBeVisible();

    // Activity Check-In
    const actInPromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.checkInActivity") &&
        res.status() === 200,
    );
    await page.getByRole("button", { name: "簽到" }).click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await actInPromise;

    // Activity Check-Out
    const actOutPromise = page.waitForResponse(
      (res) =>
        res.url().includes("volunteerActivity.checkInActivity") &&
        res.status() === 200,
    );
    await page.getByRole("button", { name: "簽退" }).click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await actOutPromise;

    // 3. Verify Stats Page
    await page.goto("/volunteer/workingstats");
    const statsTable = page.getByRole("table");
    await expect(page.getByRole("heading", { name: "打卡紀錄" })).toBeVisible();

    // Verify "All" view shows the activity
    await expect(statsTable).toContainText(activityTitle);

    // Scope the click to the tabs container to avoid clicking the table cell
    const tabs = page.locator(".tabs");

    // Filter by "主題工作" (Subject/Activity Work)
    await tabs.getByText("主題工作", { exact: true }).click();
    await expect(statsTable).toContainText(activityTitle);

    // Filter by "日常工作" (Casual Work)
    await tabs.getByText("日常工作", { exact: true }).click();

    // FIX: Don't look for the label "日常工作" inside the table.
    // Instead, verify the activity title is GONE and the casual log (date) is present.
    await expect(statsTable).not.toContainText(activityTitle);

    // Get current date in the format seen in the snapshot: "2025/12/21"
    const today = new Date()
      .toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/-/g, "/");

    await expect(statsTable).toContainText(today);

    // 4. Verify Year Selection
    const yearLabel = page.getByText("2025 年度回顧");
    await expect(yearLabel).toBeVisible();

    const yearSelect = page.getByRole("combobox").first();
    await yearSelect.selectOption("2024");
    await expect(page.getByText("2024 年度回顧")).toBeVisible();

    await yearSelect.selectOption("2026");
    await expect(page.getByText("2026 年度回顧")).toBeVisible();
  });
});
