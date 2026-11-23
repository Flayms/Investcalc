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
  /** Scenario to select before the shot. */
  select?: string;
  /** Only the value explorer, in this diagram. */
  explorer?: "Distribution" | "Trade-off";
  /** Only the scenario settings card. */
  settings?: boolean;
  /** Browser language of the first visit (REQ-012-03). */
  locale?: string;
};

const shots: Shot[] = [
  { name: "home", device: desktop },
  { name: "home-dark", device: { ...desktop, colorScheme: "dark" as const } },
  { name: "home-mobile", device: iPhone },
  { name: "scenario-hidden", device: desktop, hide: "2× buy and hold" },
  { name: "results-yearly-return", device: desktop, unit: "% p.a." },
  {
    name: "value-explorer",
    device: desktop,
    select: "2× buy and hold",
    explorer: "Distribution",
  },
  {
    name: "value-explorer-tradeoff",
    device: desktop,
    select: "2× buy and hold",
    explorer: "Trade-off",
  },
  { name: "slider-insight", device: desktop, select: "2× buy and hold", settings: true },
  { name: "market", device: desktop, view: "Market & data" },
  { name: "market-history", device: desktop, view: "Market & data", frame: "Max" },
  { name: "home-de", device: desktop, locale: "de-DE" },
  { name: "home-mobile-de", device: iPhone, locale: "de-DE" },
  { name: "market-de", device: desktop, view: "Markt & Daten", locale: "de-DE" },
];

for (const shot of shots) {
  const { name, device, view, hide, frame, unit, select, explorer, settings, locale } = shot;
  test.describe(name, () => {
    test.use({ ...device, ...(locale && { locale }) });
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto("/");
      if (hide) await page.getByRole("button", { name: `Show ${hide}` }).click();
      if (select)
        await page
          .getByRole("tablist", { name: "Scenarios" })
          .getByRole("tab", { name: select })
          .click();
      if (view) {
        await page.getByRole("tab", { name: view }).click();
        await expect(page.getByText(/^(Data basis|Datenbasis)$/)).toBeVisible();
        if (frame) await page.getByRole("tab", { name: frame, exact: true }).click();
      } else {
        // Wait for the simulation and the analysis of the selected scenario.
        await expect(page.getByTestId("explorer-takeaway")).toBeVisible({ timeout: 60_000 });
        await expect(
          page.getByRole("status").filter({ hasText: /Simulating|Analysing|simuliert|analysiert/ }),
        ).toHaveCount(0, { timeout: 60_000 });
        if (unit) await page.getByRole("button", { name: unit, exact: true }).click();
        await page.mouse.move(0, 0);
      }
      const path = `docs/screenshots/${name}.png`;
      if (explorer) {
        const card = page.locator("#value-explorer");
        await card.getByRole("button", { name: explorer }).click();
        await card.screenshot({ path });
      } else if (settings) {
        await page
          .locator("[data-slot=card]", { hasText: "Scenario settings" })
          .screenshot({ path });
      } else {
        await page.screenshot({ path, fullPage: true });
      }
    });
  });
}
