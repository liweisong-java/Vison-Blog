import { expect, test } from "@playwright/test";

test("article page renders content, toc, and comments mount", async ({ page }) => {
  await page.goto("/posts/from-notes-to-site/");

  await expect(page.getByRole("heading", { name: "From Notes to Site" })).toBeVisible();
  await expect(page.getByText("Contents")).toBeVisible();
  await expect(page.locator("[data-comments-root]")).toBeVisible();
});
