import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
const desktop = { viewport: { width: 1440, height: 900 } };

type Shot = {
  name: string;
  device: object;
  view?: string;
  hide?: string;
  frame?: string;
  unit?: string;
};

const shots: Shot[] = [
  { name: "home", device: desktop },
  { name: "home-dark", device: { ...desktop, colorScheme: "dark" as const } },
  { name: "home-mobile", device: iPhone },
  { name: "scenario-hidden", device: desktop, hide: "2× buy and hold" },
  { name: "results-yearly-return", device: desktop, unit: "% p.a." },
  { name: "market", device: desktop, view: "Market & data" },
  { name: "market-history", device: desktop, view: "Market & data", frame: "Max" },
];

for (const { name, device, view, hide, frame, unit } of shots) {
  test.describe(name, () => {
    test.use(device);
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto("/");
      if (hide) await page.getByRole("button", { name: `Show ${hide}` }).click();
      if (view) {
        await page.getByRole("tab", { name: view }).click();
        await expect(page.getByText("Data basis")).toBeVisible();
        if (frame) await page.getByRole("tab", { name: frame, exact: true }).click();
      } else {
        // Wait for the simulation and the analysis of the selected scenario.
        await expect(page.getByTestId("leverage-takeaway")).toBeVisible({ timeout: 60_000 });
        await expect(page.getByText("Simulating…").first()).toBeHidden({ timeout: 60_000 });
        if (unit) await page.getByRole("button", { name: unit, exact: true }).click();
        await page.mouse.move(0, 0);
      }
      await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
    });
  });
}
