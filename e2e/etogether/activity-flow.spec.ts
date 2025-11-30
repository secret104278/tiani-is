import { expect, test } from "@playwright/test";
import {
  createEtogetherActivity,
  registerForActivity,
} from "../utils/etogether-helpers";

test.describe("Etogether Activity Flow", () => {
  test("should create activity and register", async ({ page }) => {
    const { title } = await createEtogetherActivity(page, {
      title: "Test Etogether Activity",
      location: "Test Location",
      subgroups: [{ title: "Group A", description: "Description for Group A" }],
      description: "Main description",
    });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await registerForActivity(page, "Group A");

    await expect(page.getByRole("button", { name: "修改報名" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消報名" })).toBeVisible();
  });
});
