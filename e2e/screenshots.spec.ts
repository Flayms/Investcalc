import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
const desktop = { viewport: { width: 1440, height: 900 } };

const shots = [
  { name: "home", device: desktop, view: undefined },
  { name: "home-mobile", device: iPhone, view: undefined },
  { name: "market", device: desktop, view: "Market & data" },
];

for (const { name, device, view } of shots) {
  test.describe(name, () => {
    test.use(device);
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto("/");
      if (view) {
        await page.getByRole("tab", { name: view }).click();
        await expect(page.getByText("Data basis")).toBeVisible();
      } else {
        // Wait for the simulation and the analysis of the selected scenario.
        await expect(page.getByTestId("leverage-takeaway")).toBeVisible({ timeout: 60_000 });
      }
      await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
    });
  });
}
