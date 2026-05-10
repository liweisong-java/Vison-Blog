import { expect, test } from "@playwright/test";

test("homepage shows hero, featured story, and category filter", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /writing across code and life/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tech" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Life" })).toBeVisible();
  await expect(page.getByText("From Notes to Site")).toBeVisible();
});
