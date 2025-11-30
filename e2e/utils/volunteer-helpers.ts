import { type Page, expect } from "@playwright/test";

export interface CreateActivityOptions {
  titleIndex?: number;
  headcount?: string;
  location?: string;
  offsetHours?: number;
  duration?: string;
  description?: string;
  isDraft?: boolean;
}

export async function createActivity(
  page: Page,
  options: CreateActivityOptions = {},
) {
  const {
    titleIndex = 1,
    headcount = "5",
    location,
    offsetHours = 1,
    duration = "2",
    description = "Test Description",
    isDraft = false,
  } = options;

  await page.goto("/volunteer/activity/new");

  const select = page.locator('select[name="title"]');
  await select.selectOption({ index: titleIndex });

  const title = await select.evaluate(
    (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text,
  );

  await page.fill('input[name="headcount"]', headcount);

  const finalLocation =
    location ||
    `Test Location ${Date.now()}-${Math.random().toString(36).substring(7)}`;
  await page.fill('input[name="location"]', finalLocation);

  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetHours * 60);
  const offset = now.getTimezoneOffset() * 60000;
  const dateString = new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);

  await page.fill('input[name="startDateTime"]', dateString);
  await page.fill('input[name="duration"]', duration);
  await page.fill('textarea[name="description"]', description);

  if (isDraft) {
    await page.getByRole("button", { name: "保存草稿" }).click();
  } else {
    await page.getByRole("button", { name: "送出" }).click();
  }

  await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);

  return {
    id: page.url().split("/").pop()!,
    location: finalLocation,
    title: title || "",
    description,
  };
}

export async function ensureCasualCheckOut(page: Page) {
  const card = page.locator(".card", { hasText: "日常工作" });
  await expect(card).toBeVisible();

  const button = card.locator("button");
  const initialText = await button.innerText();

  if (initialText.includes("簽退")) {
    await button.click();
    await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
    await page.getByRole("button", { name: "打卡", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(button).toContainText(/簽到|再次簽到/);
  }
}

export async function performCasualCheckIn(page: Page) {
  const card = page.locator(".card", { hasText: "日常工作" });
  const button = card.locator("button");

  await expect(button).toContainText(/簽到|再次簽到/);
  await button.click();

  await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
  const dialogButton = page.getByRole("button", { name: "打卡", exact: true });
  await expect(dialogButton).toBeEnabled();
  await dialogButton.click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(button).toContainText("簽退");
}

export async function performCasualCheckOut(page: Page) {
  const card = page.locator(".card", { hasText: "日常工作" });
  const button = card.locator("button");

  await expect(button).toContainText("簽退");
  await button.click();

  await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
  await page.getByRole("button", { name: "打卡", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(button).toContainText(/簽到|再次簽到/);
}

export async function performActivityCheckIn(page: Page) {
  const checkInBtn = page.getByRole("button", { name: "簽到" });
  await expect(checkInBtn).toBeEnabled();
  await checkInBtn.click();
  await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
  await page.getByRole("button", { name: "打卡", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

export async function performActivityCheckOut(page: Page) {
  const checkOutBtn = page.getByRole("button", { name: "簽退" });
  await expect(checkOutBtn).toBeVisible();
  await expect(checkOutBtn).toBeEnabled();
  await checkOutBtn.click();
  await expect(page.getByRole("heading", { name: "定位打卡" })).toBeVisible();
  await page.getByRole("button", { name: "打卡", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

export async function setManualCheckInTimes(
  page: Page,
  checkInTime: string,
  checkOutTime: string,
) {
  await page.evaluate(
    ({ checkInTime, checkOutTime }) => {
      const setNativeValue = (element: HTMLInputElement, value: string) => {
        const valueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        valueSetter?.call(element, value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("blur", { bubbles: true }));
      };
      const checkIn = document.querySelector(
        'input[name="checkInAt"]',
      ) as HTMLInputElement;
      const checkOut = document.querySelector(
        'input[name="checkOutAt"]',
      ) as HTMLInputElement;
      if (checkIn && checkOut) {
        setNativeValue(checkIn, checkInTime);
        setNativeValue(checkOut, checkOutTime);
      }
    },
    { checkInTime, checkOutTime },
  );
}
