import { expect, test } from "@playwright/test";

test("private dashboard stays out of public navigation and renders all core sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation").getByText("站点统计")).toHaveCount(0);

  await page.goto("/secret-dashboard/");
  await expect(page.getByRole("heading", { name: "站点统计" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "内容统计" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "访问统计" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "发布链路" })).toBeVisible();
  await expect(page.locator("meta[name='robots']")).toHaveAttribute(
    "content",
    "noindex,nofollow,noarchive"
  );
});
