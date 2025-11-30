import { type Page, expect, test } from "@playwright/test";

export interface CreateEtogetherActivityOptions {
  title?: string;
  location?: string;
  offsetMinutes?: number;
  duration?: string;
  description?: string;
  subgroups?: Array<{ title: string; description?: string }>;
}

function getUniqueId(prefix = ""): string {
  let workerIndex = 0;
  try {
    workerIndex = test.info().workerIndex ?? 0;
  } catch {
    workerIndex = process.pid % 1000;
  }
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}${workerIndex}-${timestamp}-${random}`;
}

export async function createEtogetherActivity(
  page: Page,
  options: CreateEtogetherActivityOptions = {},
) {
  const {
    title,
    location,
    offsetMinutes = 60,
    duration = "2",
    description = "Test Description",
    subgroups = [{ title: "Group A", description: "Description for Group A" }],
  } = options;

  const finalTitle = title || `E2E Activity ${getUniqueId()}`;
  const finalLocation = location || `Test Location ${getUniqueId()}`;

  await page.goto("/etogether/activity/new");

  await page.locator('input[name="title"]').fill(finalTitle);
  await page.locator('input[name="location"]').fill(finalLocation);

  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  const offset = now.getTimezoneOffset() * 60000;
  const dateString = new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);

  await page.locator('input[name="startDateTime"]').fill(dateString);
  await page.locator('input[name="duration"]').fill(duration);

  for (let i = 0; i < subgroups.length; i++) {
    const subgroup = subgroups[i];
    if (!subgroup) continue;
    await page.getByRole("button", { name: "新增分組" }).click();
    await page
      .locator(`input[name="subgroups.${i}.title"]`)
      .fill(subgroup.title);
    if (subgroup.description) {
      await page
        .locator(`textarea[name="subgroups.${i}.description"]`)
        .fill(subgroup.description);
    }
  }

  await page.locator('textarea[name="description"]').fill(description);

  await page.getByRole("button", { name: "送出" }).click();

  await expect(page).toHaveURL(/\/etogether\/activity\/detail\/\d+/);

  return {
    id: page.url().split("/").pop()!,
    title: finalTitle,
    location: finalLocation,
    description,
    subgroups,
  };
}

export async function registerForActivity(page: Page, subgroupLabel: string) {
  await page.getByRole("button", { name: "報名", exact: true }).click();

  await expect(page.getByRole("heading", { name: /報名$/ })).toBeVisible({
    timeout: 10000,
  });

  await page
    .locator('select[name="subgroupId"]')
    .selectOption({ label: subgroupLabel });

  await page.getByRole("button", { name: "送出報名" }).click();

  await expect(page.getByText("我的報名表")).toBeVisible();
}

export async function cancelRegistration(page: Page) {
  await page.getByRole("button", { name: "取消報名" }).click();
  await page.getByRole("button", { name: "確認" }).click();
  await expect(
    page.getByRole("button", { name: "報名", exact: true }),
  ).toBeVisible();
}

export async function performEtogetherCheckIn(page: Page) {
  await page.getByRole("button", { name: "簽到" }).click();
  await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
  await page.getByRole("button", { name: "打卡" }).click();
  await expect(page.getByRole("button", { name: "已完成簽到" })).toBeVisible();
}
