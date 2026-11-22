import { expect, test } from "@playwright/test";

test("screenshot: home", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Wait for the simulation and the analysis of the selected scenario.
  await expect(page.getByTestId("leverage-takeaway")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "docs/screenshots/home.png", fullPage: true });
});

test("screenshot: market", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("tab", { name: "Market & data" }).click();
  await expect(page.getByText("Data basis")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/market.png", fullPage: true });
});
