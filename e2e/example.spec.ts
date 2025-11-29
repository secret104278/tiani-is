import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/auth/signin");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/天一志工隊/i);
});
