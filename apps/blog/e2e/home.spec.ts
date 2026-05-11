import { expect, test } from "@playwright/test";

test("homepage shows hero, featured story, and category filter", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.getByRole("button", { name: "技术" })).toBeVisible();
  await expect(page.getByRole("button", { name: "生活" })).toBeVisible();
  await expect(page.getByText("从笔记到博客")).toBeVisible();
  await expect(page.getByText(/这里没有刻意区分“输出”和“生活”/i)).toBeHidden();
  await expect(page.getByText(/你可以顺着时间往下读/i)).toBeHidden();
  await page.getByRole("button", { name: "技术" }).click();
  await expect(page.getByText("周末散步")).toBeHidden();
  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.getByText("周末散步")).toBeVisible();
  await page.getByPlaceholder(/搜索文章、标签或主题/i).fill("astro");
  await expect(page.getByText("周末散步")).toBeHidden();
});
