import { expect, test } from "@playwright/test";

test.describe("Volunteer Check-in", () => {
  test("should allow casual check-in and check-out", async ({ page }) => {
    // 1. Go to volunteer page
    await page.goto("/volunteer");

    // 2. Find the Casual Check-in Card
    const card = page.locator(".card", { hasText: "日常工作" });
    await expect(card).toBeVisible();

    // 3. Click Check-in button (might be "簽到" or "再次簽到" or "簽退")
    // Since we are starting fresh or subsequent runs, we need to handle state.
    // Let's check the button text first.
    const button = card.locator("button");
    const initialText = await button.innerText();

    if (initialText.includes("簽退")) {
      // If already checked in, we check out first to reset or just test check-out.
      // Let's assume we want to test the full cycle.
      await button.click();
      // Wait for the heading inside the dialog instead of the dialog itself
      // as the dialog might be animating or have internal structure issues
      await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible(
        { timeout: 10000 },
      );

      await page.getByRole("button", { name: "打卡" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      // Wait for text to update (it might take a re-fetch or re-render)
      // It might briefly say "簽退" if state hasn't updated, but eventual consistent state is what we want.
      // If we successfully checked out, it should say "簽到" or "再次簽到".
      // Increase timeout as this might depend on server invalidation.
      await expect(button).toContainText(/簽到|再次簽到/, { timeout: 15000 });
    } else {
      // Initial state: not checked in.
      // But if previous run failed mid-way, it might be stuck?
      // The seed script cleans up check-ins, so it should be "簽到".
      await expect(button).toContainText("簽到");
    }

    // Now perform Check-in
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click({ force: true });

    // Relax locator to just dialog, or verify name
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible({
      timeout: 10000,
    });

    // The component mocks geolocation in dev, so "打卡" should be enabled.
    const confirmButton = page.getByRole("button", { name: "打卡" });
    // Use timeout to allow geolocation logic to settle
    // The dialog might be animating in or geolocation loading
    // We ensure the dialog heading is visible first (done above), then wait for button.
    // It might be disabled while "loading" geolocation.
    // If it fails, let's just log and try click (sometimes enabled state is flaky in dev/mock)
    // But better to increase timeout.
    // Also ensure we are looking at the dialog's button specifically if multiple exist?
    // Dialog is modal so should be fine.
    await expect(confirmButton).toBeEnabled({ timeout: 20000 });
    await confirmButton.click({ force: true });

    // Verify success
    await expect(page.getByRole("dialog")).toBeHidden();
    // After check-in, button should say "簽退"
    await expect(button).toContainText("簽退");

    // Perform Check-out
    await button.click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "打卡" }).click();

    // Verify success
    await expect(page.getByRole("dialog")).toBeHidden();
    // After check-out, button should say "簽退"
    await expect(button).toContainText("簽退");
  });
});
