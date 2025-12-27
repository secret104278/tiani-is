import { expect, test } from "../fixtures";

test.describe("Qiudaoren (Candidate) Management", () => {
  test("Add a new Qiudaoren with valid data", async ({
    loginAsYideWorkAdmin,
    createYideWorkActivity,
    page,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    await page.getByRole("link", { name: "求道人清單" }).click();

    await page.getByRole("button", { name: "我要帶人來求道" }).click();
    await page.locator('input[name="name"]').fill("Test Person");
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="yinShiPhone"]').fill("0912345678");
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    await expect(page.getByText("乾").first()).toBeVisible();
    await expect(page.getByText("Test Person")).toBeVisible();

    await page.getByRole("button", { name: "我要帶人來求道" }).click();
    await page.locator('input[name="name"]').fill("Test Child");
    await page.getByRole("spinbutton").fill("110");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="yinShiPhone"]').fill("0912345678");
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    await expect(page.getByText("童").first()).toBeVisible();
    await expect(page.getByText("Test Child")).toBeVisible();
  });

  test("Validate Qiudaoren form inputs", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    await page.getByRole("link", { name: "求道人清單" }).click();
    await page.getByRole("button", { name: "我要帶人來求道" }).click();

    await page.locator('input[name="name"]').fill("Test Person");
    await page.getByRole("spinbutton").fill("200");
    await page.locator('input[name="phone"]').fill("123456");

    await page.getByRole("button", { name: "新增", exact: true }).click();

    await expect(page.getByText("民國年份不能是未來年份")).toBeVisible();
    await expect(
      page.getByText("電話號碼必須以 09 開頭，共 10 位數字"),
    ).toBeVisible();

    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    await expect(page.getByLabel("新增求道人")).not.toBeVisible();
    await expect(page.getByText("Test Person")).toBeVisible();
  });

  test("Toggle Qiudaoren check-in status", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);

    await page.getByRole("button", { name: "我要帶人來求道" }).click();
    await page.locator('input[name="name"]').fill("CheckIn Person");
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    const candidateCard = page
      .locator(".card")
      .filter({ hasText: "CheckIn Person" });
    const checkInButton = candidateCard.getByRole("button", { name: "報到" });
    await checkInButton.click();

    await expect(
      candidateCard.getByRole("button", { name: "已到" }),
    ).toBeVisible();

    await candidateCard.getByRole("button", { name: "已到" }).click();

    await expect(
      candidateCard.getByRole("button", { name: "報到" }),
    ).toBeVisible();
  });

  test("View by Yin-Bao Shi (Introducer/Guarantor)", async ({
    loginAsYideWorkAdmin,
    page,
    createYideWorkActivity,
  }) => {
    const activity = await createYideWorkActivity(loginAsYideWorkAdmin.id);
    await page.goto(`/yidework/activity/detail/${activity.id}`);
    await page.getByRole("link", { name: "求道人清單" }).click();

    await page.getByRole("button", { name: "我要帶人來求道" }).click();
    await page.locator('input[name="name"]').fill("Qiudaoren Person");
    await page.getByRole("spinbutton").fill("80");
    await page.locator('input[name="phone"]').fill("0912345678");
    await page.locator('input[name="yinShi"]').fill("Yin Person");
    await page
      .getByRole("group", { name: "引師性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.locator('input[name="yinShiPhone"]').fill("0912345678");
    await page.locator('input[name="baoShi"]').fill("Bao Person");
    await page
      .getByRole("group", { name: "保師性別", exact: true })
      .getByLabel("坤")
      .click();
    await page
      .getByRole("group", { name: "性別", exact: true })
      .getByLabel("乾")
      .click();
    await page.getByRole("button", { name: "新增", exact: true }).click();

    await page.getByRole("button").filter({ hasText: "引保師" }).click();

    await expect(page.getByText("乾").first()).toBeVisible();
    await expect(page.getByText("坤").first()).toBeVisible();
    await expect(page.getByText("Yin Person")).toBeVisible();
    await expect(page.getByText("Bao Person")).toBeVisible();
  });
});
