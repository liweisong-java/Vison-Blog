import { expect, test } from "@playwright/test";

test("route pages exist for categories, tags, archive, and about", async ({ page }) => {
  await page.goto("/category/tech/");
  await expect(page.getByRole("heading", { name: /tech/i })).toBeVisible();

  await page.goto("/tags/");
  await expect(page.getByRole("heading", { name: /tags/i })).toBeVisible();

  await page.goto("/archive/");
  await expect(page.getByRole("heading", { name: /archive/i })).toBeVisible();

  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
});
