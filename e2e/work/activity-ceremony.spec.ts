import { addDays, format } from "date-fns";
import { expect, test } from "../fixtures";

test.describe("YideWork Activity Ceremony & Volunteer List", () => {
  const futureDate = addDays(new Date(), 7);
  const futureDateIso = format(futureDate, "yyyy-MM-dd'T'10:00");

  test("Create a 'Ceremony' activity with custom title and custom roles", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    await page.goto("/work/yide/activity/new");

    await page.locator('select[name="title"]').selectOption("執禮通知");

    // Verify "Ceremony Name" input is visible
    await expect(page.getByText("道務名稱")).toBeVisible();
    const customTitle = `春季大典 ${Date.now()}`;
    await page.locator('input[name="roleTitleInput"]').fill(customTitle);

    await page
      .locator('select[name="locationId"]')
      .selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);

    // Add custom roles
    await page.getByRole("button", { name: "新增自訂欄位" }).click();
    await page.locator('input[placeholder="職務 (如: 交通)"]').fill("交通");
    await page.locator('input[placeholder="人員姓名"]').fill("張三");

    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);
    await expect(page.getByRole("heading", { name: customTitle })).toBeVisible();

    // Verify custom role display
    await expect(page.getByText("交通")).toBeVisible();
    await expect(page.getByText("張三")).toBeVisible();

    // Verify "Volunteer List" button is visible for ceremony
    await expect(page.getByRole("button", { name: "志願幫辦名單" })).toBeVisible();
  });

  test("Volunteer List Dialog shows current assignments", async ({
    loginAsWorkAdmin,
    page,
  }) => {
    const timestamp = Date.now();
    const customTitle = `夏季大典 ${timestamp}`;
    
    await page.goto("/work/yide/activity/new");
    await page.locator('select[name="title"]').selectOption("執禮通知");
    await page.locator('input[name="roleTitleInput"]').fill(customTitle);
    
    // Fill a standard role
    const conductorSection = page.locator('div:has(> label > span:text-is("操持"))');
    await conductorSection.locator('input').fill("李四");

    await page.locator('select[name="locationId"]').selectOption({ label: "天一聖道院" });
    await page.locator('input[name="startDateTime"]').fill(futureDateIso);
    await page.getByRole("button", { name: "送出" }).click();

    await expect(page).toHaveURL(/\/work\/yide\/activity\/detail\/\d+/);

    // Click Volunteer List button
    await page.getByRole("button", { name: "志願幫辦名單" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("志願幫辦名單")).toBeVisible();
    
    // Verify assignments in dialog
    await expect(dialog.getByText("操持")).toBeVisible();
    await expect(dialog.getByText("李四")).toBeVisible();

    // Even empty roles should be visible now
    await expect(dialog.getByText("操持")).toBeVisible();
    await expect(dialog.getByText("護壇")).toBeVisible();
    
    // Close the dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
