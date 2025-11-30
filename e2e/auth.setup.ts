import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { seedTestUser } from "../scripts/seed-test-user";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  await seedTestUser();

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

  await page.goto("/volunteer");

  await expect(page).toHaveURL("/volunteer");

  await page.context().storageState({ path: authFile });
});
