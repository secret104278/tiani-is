import { expect, test } from "@playwright/test";

test.describe("Volunteer Stats", () => {
    test("should display working stats", async ({ page }) => {
        await page.goto("/volunteer");

        // Click on the stats link/card
        // Based on index.tsx: <Link href="/volunteer/workingstats" ...><HourStats .../></Link>
        await page.locator('a[href="/volunteer/workingstats"]').click();

        await expect(page).toHaveURL("/volunteer/workingstats");

        // Verify presence of key elements
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // Wait for the stats to load (it might take a moment)
        await expect(page.getByText(/年度回顧/)).toBeVisible({ timeout: 10000 });
    });
});
