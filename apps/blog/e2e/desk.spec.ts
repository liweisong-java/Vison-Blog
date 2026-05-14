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

test("desk video page submits a task directly on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/video-api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: {
          queueSize: 2,
          pending: 1,
          publishedVideos: 6
        },
        running: false,
        lastResult: {
          processed: 1,
          results: [{ slug: "video-demo-post" }]
        },
        lastError: null
      })
    });
  });
  let submitPayload: Record<string, unknown> | null = null;
  await page.route("**/video-api/submit", async (route) => {
    submitPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        job: {
          id: "job-123"
        },
        result: {
          processed: 1,
          results: [{ slug: "video-demo-post" }]
        },
        status: {
          queueSize: 2,
          pending: 0,
          publishedVideos: 7
        },
        running: false,
        lastResult: {
          processed: 1,
          results: [{ slug: "video-demo-post" }]
        },
        lastError: null
      })
    });
  });
  await page.goto("/desk/video/");

  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".desk-video-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "自动读取视频文字" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用我提供的文本" })).toBeVisible();
  await expect(page.locator("[data-video-mode-panel='auto']")).toContainText("自动模式");

  await page.getByLabel("粘贴视频链接").fill("https://www.bilibili.com/video/BV1GJ411x7h7");
  await page.getByRole("button", { name: "生成博客" }).click();

  await expect(page.locator("[data-video-feedback]")).toContainText("处理完成，文章已生成：video-demo-post");
  await expect(page.locator("[data-video-status]")).toContainText("队列总数");
  await expect(page.locator("[data-video-status]")).toContainText("已发布");
  await expect(page.locator("[data-video-status]")).toContainText("video-demo-post");
  expect(submitPayload).toMatchObject({
    url: "https://www.bilibili.com/video/BV1GJ411x7h7"
  });
  expect(submitPayload).not.toHaveProperty("transcript");

  await page.getByRole("button", { name: "使用我提供的文本" }).click();
  await expect(page.locator("[data-video-mode-panel='manual']")).toContainText("手动模式");
  await expect(page.getByRole("button", { name: "复制文本" })).toBeVisible();
});
