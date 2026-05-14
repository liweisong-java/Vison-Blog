import { expect, test } from "@playwright/test";

test("desk home behaves like a private app launcher", async ({ page }) => {
  await page.goto("/desk/");

  await expect(page.locator("meta[name='robots']")).toHaveAttribute(
    "content",
    "noindex,nofollow,noarchive"
  );
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "今天先处理什么？" })).toBeVisible();
  await expect(page.locator(".desk-app-card")).toHaveCount(4);
  await expect(page.locator(".desk-status-hint")).toHaveCount(1);
});

test("desk video page generates a runnable command on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/desk/video/");

  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".desk-video-card")).toBeVisible();

  await page.getByLabel("粘贴视频链接").fill("https://www.bilibili.com/video/BV1GJ411x7h7");
  await page.getByLabel("人工 transcript").fill("第一段整理内容。");
  await page.getByRole("button", { name: "生成入队命令" }).click();

  await expect(page.locator("[data-video-command]")).toContainText("pnpm video:enqueue");
  await expect(page.locator("[data-video-command]")).toContainText("BV1GJ411x7h7");
  await expect(page.locator("[data-video-feedback]")).toContainText(/命令已生成|可直接复制/);
});
