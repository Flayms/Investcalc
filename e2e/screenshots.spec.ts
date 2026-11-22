import { expect, test } from "@playwright/test";

const pages = [{ name: "home", path: "/" }];

for (const { name, path } of pages) {
  test(`screenshot: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    // Wait for the simulation and the analysis of the selected scenario.
    await expect(page.getByText(/Highest median/)).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  });
}
