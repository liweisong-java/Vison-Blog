import {expect, test} from "@playwright/test";

test("legacy category pages fall back to the unified reading flow", async ({page}) => {
  await page.goto("/category/life/");

    await expect(page.getByRole("heading", {name: "文章"})).toBeVisible();
    await expect(page.getByText(/内容入口已统一/i)).toBeVisible();
    await expect(page.getByText(/这里不再单独分栏目展示/i)).toBeVisible();
    await expect(page.getByRole("link", {name: "返回首页"})).toBeVisible();
});

test("archive page behaves like a time index", async ({ page }) => {
  await page.goto("/archive/");

  await expect(page.getByRole("heading", { name: "归档" })).toBeVisible();
  await expect(page.getByText(/按年份顺着往下看/i)).toHaveCount(0);
  await expect(page.locator(".archive-year").first()).toBeVisible();
  await expect(page.locator(".archive-list li").first()).toBeVisible();
});
