import { expect, test } from "@playwright/test";

test("seed", async ({ page }) => {
  await page.goto("/volunteer");
  await expect(page).toHaveURL("/volunteer");
});
