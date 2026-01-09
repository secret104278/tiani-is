import { expect, test } from "@playwright/test";

test("seed", async ({ page }) => {
  await page.goto("/work");
  await expect(page).toHaveURL("/work");
});
