import { expect, test } from "@playwright/test";

test("seed", async ({ page }) => {
  // This test runs after auth.setup.ts (configured in playwright.config.ts dependencies)
  // So the user is already authenticated and seeded.

  // Verify authentication by visiting the protected page
  await page.goto("/volunteer");
  await expect(page).toHaveURL("/volunteer");
});
