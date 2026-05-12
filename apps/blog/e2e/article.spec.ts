import {expect, test} from "@playwright/test";

test("article page renders a lighter reading-first layout", async ({page}) => {
  await page.goto("/posts/from-notes-to-site/");

  await expect(page.getByRole("heading", { name: "从笔记到博客" })).toBeVisible();
    await expect(page.locator(".toc-shell--desktop").getByText("目录", {exact: true})).toBeVisible();
    await expect(page.locator(".article-header").getByText("正文", {exact: true})).toHaveCount(0);
    await expect(page.getByText(/可同步到公众号/i)).toHaveCount(0);
    await expect(page.locator(".article-header").getByText(/预计阅读/i)).toHaveCount(0);
    await expect(page.getByText(/评论区会在站点完成 giscus 配置后显示/i)).toHaveCount(0);
    await expect(page.locator("[data-comments-root]")).toHaveCount(0);
  await expect(page.locator(".article-cover")).toBeVisible();
  await expect(page.locator(".prose blockquote")).toBeVisible();
  await expect(page.locator(".prose pre")).toBeVisible();
  await expect(page.locator(".prose table")).toBeVisible();
  await expect(page.locator(".prose figure figcaption")).toBeVisible();
    await expect(page.locator(".toc-shell--desktop")).toBeVisible();
    await expect(page.locator(".toc-shell--mobile")).toHaveCount(1);
});

test("article page switches to a mobile toc and keeps the header compact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/posts/on-dao-notes/");

  await expect(page.locator(".toc-shell--desktop")).toBeHidden();
  await expect(page.locator(".toc-shell--mobile")).toBeVisible();
  await expect(page.locator(".toc-shell--mobile summary")).toContainText("本文目录");
  await expect(page.locator(".article-header")).toBeVisible();
  await expect(page.locator(".article-header").getByText(/预计阅读/i)).toHaveCount(0);
});
