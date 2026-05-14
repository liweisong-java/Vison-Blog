import {expect, test} from "@playwright/test";

test("desk home behaves like a private app launcher", async ({ page }) => {
  await page.goto("/desk/");

  await expect(page.locator("meta[name='robots']")).toHaveAttribute(
    "content",
    "noindex,nofollow,noarchive"
  );
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "今天先处理什么？" })).toBeVisible();
    await expect(page.locator(".desk-app-card")).toHaveCount(3);
  await expect(page.locator(".desk-status-hint")).toHaveCount(1);
});
