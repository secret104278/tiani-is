import { expect, test } from "@playwright/test";

test("seed", async ({ page }) => {
  await page.goto("/yidework");
  await expect(page).toHaveURL("/yidework");
});
