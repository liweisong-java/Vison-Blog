import {expect, test} from "@playwright/test";

test("route pages exist for categories, tags, archive, and about", async ({ page }) => {
  await page.goto("/category/tech/");
    await expect(page.getByRole("heading", {name: "文章"})).toBeVisible();
    await expect(page.getByText("内容入口已统一。")).toBeVisible();
    await expect(page.getByText(/这里不再单独分栏目展示/i)).toBeVisible();
  await expect(page.getByText(/预计阅读/i)).toHaveCount(0);

  await page.goto("/tags/");
  await expect(page.getByRole("heading", { name: "标签" })).toBeVisible();
  await expect(page.locator("[data-page-intro='tags']")).toBeVisible();
  await expect(page.getByText(/按主题浏览全部文章/i)).toBeHidden();

  await page.goto("/archive/");
  await expect(page.getByRole("heading", { name: "归档" })).toBeVisible();
  await expect(page.locator("[data-page-intro='archive'] .post-meta")).toContainText("共 ");
  await expect(page.locator("[data-page-intro='archive'] .post-meta")).toContainText(" 篇");
  await expect(page.locator("[data-page-intro='archive']")).toBeVisible();

  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: "关于我" })).toBeVisible();
  await expect(page.locator("[data-page-intro='about']")).toBeVisible();
  await expect(page.locator("[data-about-contact] dt")).toHaveCount(4);
  await expect(page.getByText("伟松", { exact: true })).toBeVisible();
  await expect(page.getByText(/你出想法，我出技术/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "合作方式" })).toBeVisible();
  await expect(page.getByText("github.com/liweisong-java")).toBeVisible();
  await expect(page.getByText("Vison_2000")).toBeVisible();
});

test("archive and about keep a clean single-column rhythm on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/archive/");
  await expect(page.getByRole("heading", { name: "归档" })).toBeVisible();
  await expect(page.locator(".archive-stack")).toBeVisible();

  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: "关于我" })).toBeVisible();
  await expect(page.locator(".about-profile")).toBeVisible();
  await expect(page.getByRole("heading", { name: "合作方式" })).toBeVisible();
});
