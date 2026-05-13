import { expect, test } from "@playwright/test";

test("homepage shows hero, featured story, and category filter", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.getByText(/预计阅读/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "技术" })).toBeVisible();
  await expect(page.getByRole("button", { name: "生活" })).toBeVisible();
  const leadTitle = page.locator(".lead-entry h2 a");
  await expect(leadTitle).toBeVisible();
  const leadTitleText = (await leadTitle.textContent())?.trim();
  expect(leadTitleText).toBeTruthy();
  await expect(page.getByText(/这里没有刻意区分“输出”和“生活”/i)).toBeHidden();
  await expect(page.getByText(/你可以顺着时间往下读/i)).toBeHidden();

  const postCards = page.locator(".post-card");
  const totalCards = await postCards.count();
  expect(totalCards).toBeGreaterThan(0);

  await page.getByRole("button", { name: "技术" }).click();
  await expect(page.locator(".category-filter .is-active")).toHaveText("技术");

  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.locator(".category-filter .is-active")).toHaveText("全部");

  const firstCard = postCards.first();
  const firstCardTitle = page.locator(".post-card-title a").first();
  const firstCardTitleText = ((await firstCardTitle.textContent()) ?? "").trim();
  expect(firstCardTitleText.length).toBeGreaterThan(0);
  await page.getByPlaceholder(/搜索文章、标签或主题/i).fill(firstCardTitleText);
  await expect(firstCard).toBeVisible();
});

test("homepage remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.locator(".home-intro")).toBeVisible();
  await expect(page.locator(".category-filter")).toBeVisible();
  await expect(page.getByRole("button", { name: "全部" })).toBeVisible();
  await expect(page.getByRole("button", { name: "技术" })).toBeVisible();
  await expect(page.getByRole("button", { name: "生活" })).toBeVisible();
});
