import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];

const shots = [
  { name: "home", path: "/", device: { viewport: { width: 1440, height: 900 } } },
  { name: "home-mobile", path: "/", device: iPhone },
];

for (const { name, path, device } of shots) {
  test.describe(name, () => {
    test.use(device);
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto(path);
      // Wait for the simulation and the analysis of the selected scenario.
      await expect(page.getByText(/Highest median/)).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
    });
  });
}
