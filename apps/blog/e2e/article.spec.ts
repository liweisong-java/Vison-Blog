import { expect, test } from "@playwright/test";

test("article page renders content, toc, and comments mount", async ({ page }) => {
  await page.goto("/posts/from-notes-to-site/");

  await expect(page.getByRole("heading", { name: "从笔记到博客" })).toBeVisible();
  await expect(page.getByText("目录")).toBeVisible();
  await expect(page.locator("[data-comments-root]")).toBeVisible();
  await expect(page.getByText(/可同步到公众号/i)).toBeVisible();
  await expect(page.locator(".article-kicker").getByText(/预计阅读/i)).toBeVisible();
  await expect(page.locator(".article-cover")).toBeVisible();
  await expect(page.locator(".prose blockquote")).toBeVisible();
  await expect(page.locator(".prose pre")).toBeVisible();
  await expect(page.locator(".prose table")).toBeVisible();
  await expect(page.locator(".prose figure figcaption")).toBeVisible();
  await expect(page.getByText(/评论区会在站点完成 giscus 配置后显示/i)).toBeVisible();
});
