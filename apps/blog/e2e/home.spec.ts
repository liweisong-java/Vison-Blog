import { expect, test } from "@playwright/test";

test("homepage shows a unified post stream with search", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.getByText(/预计阅读/i)).toHaveCount(0);
  await expect(page.locator(".category-filter")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "最新文章" })).toBeVisible();
  const leadTitle = page.locator(".lead-entry h2 a");
  await expect(leadTitle).toBeVisible();
  const leadTitleText = (await leadTitle.textContent())?.trim();
  expect(leadTitleText).toBeTruthy();
  await expect(page.getByText(/这里没有刻意区分“输出”和“生活”/i)).toBeHidden();
  await expect(page.getByText(/你可以顺着时间往下读/i)).toBeHidden();

  const postCards = page.locator(".post-card");
  const totalCards = await postCards.count();
  expect(totalCards).toBeGreaterThanOrEqual(0);

  if (totalCards > 0) {
    const firstCard = postCards.first();
    const firstCardTitle = page.locator(".post-card-title").first();
    const firstCardTitleText = ((await firstCardTitle.textContent()) ?? "").trim();
    expect(firstCardTitleText.length).toBeGreaterThan(0);
    await expect(firstCard.locator(".post-card-excerpt")).toHaveCount(0);
    await expect(firstCard.locator(".tag-list")).toHaveCount(0);
    await expect(firstCard.locator(".post-card-link")).toHaveCount(1);
    await page.getByPlaceholder(/搜索文章、标签或主题/i).fill(firstCardTitleText);
    await expect(firstCard).toBeVisible();
  } else {
    await expect(page.locator(".post-list")).toHaveCount(1);
    await expect(page.locator(".lead-entry")).toBeVisible();
  }
});

test("homepage remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.locator(".home-intro")).toBeVisible();
  await expect(page.locator(".category-filter")).toHaveCount(0);
  await expect(page.getByPlaceholder(/搜索文章、标签或主题/i)).toBeVisible();
  await expect(page.locator(".side-links")).toBeVisible();
  const mobileCardLink = page.locator(".post-card-link").first();
  if (await mobileCardLink.count()) {
    await expect(mobileCardLink).toBeVisible();
  }
});
