import { expect, test } from "@playwright/test";

test("category pages render as concise collections", async ({ page }) => {
  await page.goto("/category/life/");

  await expect(page.getByRole("heading", { name: "生活" })).toBeVisible();
  await expect(page.getByText(/慢一点的观察/i)).toHaveCount(0);
  await expect(page.locator(".category-posts .post-card").first()).toBeVisible();
});

test("archive page behaves like a time index", async ({ page }) => {
  await page.goto("/archive/");

  await expect(page.getByRole("heading", { name: "归档" })).toBeVisible();
  await expect(page.getByText(/按年份顺着往下看/i)).toHaveCount(0);
  await expect(page.locator(".archive-year").first()).toBeVisible();
  await expect(page.locator(".archive-list li").first()).toBeVisible();
});
