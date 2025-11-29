import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { seedTestUser } from "../scripts/seed-test-user";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
    // 1. Seed the test user and session in the database
    await seedTestUser();

    // 2. Set the session cookie directly
    const cookies = [
        {
            name: "next-auth.session-token",
            value: "e2e-test-session-token",
            url: "http://127.0.0.1:3100",
            httpOnly: true,
            sameSite: "Lax" as const,
            expires: Date.now() / 1000 + 24 * 60 * 60,
        },
        {
            name: "authjs.session-token",
            value: "e2e-test-session-token",
            url: "http://127.0.0.1:3100",
            httpOnly: true,
            sameSite: "Lax" as const,
            expires: Date.now() / 1000 + 24 * 60 * 60,
        },
    ];
    await page.context().addCookies(cookies);

    // 3. Verify authentication by visiting a protected page
    await page.goto("/volunteer");

    // If we are on /volunteer, auth worked.
    await expect(page).toHaveURL("/volunteer");

    // 4. Save the storage state
    await page.context().storageState({ path: authFile });
});
