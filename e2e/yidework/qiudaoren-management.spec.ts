import { expect, test } from "../fixtures";

test.describe("Qiudaoren (Candidate) Management", () => {
  test("Add a new Qiudaoren with valid data", async ({
    loginAsYideWorkAdmin,
    createYideWorkActivity,
    page,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    // 2. Click 'Qiudaoren List' (求道人清單) button.
    await page.getByRole("link", { name: "求道人清單" }).click();

    // 3. Click 'Add Qiudaoren' (新增求道人) and fill form for an adult male
    await page.getByRole("button", { name: "新增求道人" }).click();
    await page.locator('input[name="name"]').fill("Test Person");
    // Candidate Gender: Male (乾)
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    // Introducer Gender: Male (乾)
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="yinShiPhone"]').fill("0912345678");
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    // Guarantor Gender: Female (坤)
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 4. Verify the new person appears in the list under '乾' category
    await expect(page.getByText("乾").first()).toBeVisible();
    await expect(page.getByText("Test Person")).toBeVisible();

    // 5. Add a child to verify 'Tong' (童) gender calculation
    await page.getByRole("button", { name: "新增求道人" }).click();
    await page.locator('input[name="name"]').fill("Test Child");
    // Candidate: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .first()
      .click();
    await page.getByRole("spinbutton").fill("110"); // Born in Republic 110 (2021)
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    // Introducer: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .nth(1)
      .click();
    await page.locator('input[name="yinShiPhone"]').fill("0912345678");
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    // Guarantor: Female
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^坤$/ })
      .last()
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 6. Verify the child appears under '童' category
    await expect(page.getByText("童").first()).toBeVisible();
    await expect(page.getByText("Test Child")).toBeVisible();
  });

  test("Validate Qiudaoren form inputs", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    // 1. Navigate to a 'Ban Dao' activity and open 'Add Qiudaoren' dialog
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    await page.getByRole("link", { name: "求道人清單" }).click();
    await page.getByRole("button", { name: "新增求道人" }).click();

    // 2. Enter an invalid phone number and invalid birth year
    await page.locator('input[name="name"]').fill("Test Person");
    // Candidate: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .first()
      .click();
    await page.getByRole("spinbutton").fill("200"); // Future year
    await page.locator('input[name="phone"]').fill("123456"); // Invalid format

    // 4. Click 'Add' (新增) to trigger validation.
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 5. Assert validation error messages appear
    await expect(page.getByText("民國年份不能是未來年份")).toBeVisible();
    await expect(
      page.getByText("電話號碼必須以 09 開頭，共 10 位數字"),
    ).toBeVisible();

    // 6. Correct the inputs and submit.
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    // Introducer: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .nth(1)
      .click();
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    // Guarantor: Female
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^坤$/ })
      .last()
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 7. Assert success (dialog closes and person is in list)
    await expect(page.getByLabel("新增求道人")).not.toBeVisible();
    await expect(page.getByText("Test Person")).toBeVisible();
  });

  test("Toggle Qiudaoren check-in status", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    // 1. Navigate to a 'Ban Dao' activity and ensure a candidate exists
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    // 2. Add a Qiudaoren for check-in test if not already present (using steps from previous test for robustness)
    await page.getByRole("button", { name: "新增求道人" }).click();
    await page.locator('input[name="name"]').fill("CheckIn Person");
    // Candidate: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .first()
      .click();
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    // Introducer: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .nth(1)
      .click();
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    // Guarantor: Female
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^坤$/ })
      .last()
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 3. Locate the candidate card and toggle check-in
    // Use a more robust way to find the candidate card
    const candidateCard = page
      .locator(".card")
      .filter({ hasText: "CheckIn Person" });
    const checkInButton = candidateCard.getByRole("button", { name: "報到" });
    await checkInButton.click();

    // 4. Verify the button state changes to 'Checked In' (已到)
    await expect(
      candidateCard.getByRole("button", { name: "已到" }),
    ).toBeVisible();

    // 5. Click the button again to revert
    await candidateCard.getByRole("button", { name: "已到" }).click();

    // 6. Verify the button state reverts to 'Check In' (報到)
    await expect(
      candidateCard.getByRole("button", { name: "報到" }),
    ).toBeVisible();
  });

  test("View by Yin-Bao Shi (Introducer/Guarantor)", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    // 1. Navigate to the Qiudaoren list page and ensure a candidate exists
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);
    await page.getByRole("link", { name: "求道人清單" }).click();

    // 2. Add a Qiudaoren to ensure we have data to see
    await page.getByRole("button", { name: "新增求道人" }).click();
    await page.locator('input[name="name"]').fill("Qiudaoren Person");
    // Candidate: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .first()
      .click();
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    // Introducer: Male
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^乾$/ })
      .nth(1)
      .click();
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    // Guarantor: Female
    await page
      .getByLabel("新增求道人")
      .locator("label")
      .filter({ hasText: /^坤$/ })
      .last()
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    // 3. Click the 'Yin Bao Shi' (引保師) tab.
    // Try both button and text-based selection
    await page.getByRole("button").filter({ hasText: "引保師" }).click();

    // 4. Verify the list reorganizes to show names of Introducers/Guarantors grouped by gender.
    // In Yin-Bao Shi view, we should see the Yin/Bao names under gender headers.
    await expect(page.getByText("乾").first()).toBeVisible();
    await expect(page.getByText("坤").first()).toBeVisible();
    await expect(page.getByText("Yin Person")).toBeVisible();
    await expect(page.getByText("Bao Person")).toBeVisible();
  });
});
