import { devices, expect, type Page, test } from "@playwright/test";

// `bun run screenshots` writes docs/screenshots/*.png for the README and PRs.
// Each shot shows one thing: the first screen, or a single card cropped to itself,
// so it stays legible at the width GitHub shows it.

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
// Narrow enough that the hero stays readable when GitHub scales it down; 2× for sharp text.
const desktop = { viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 };
// Wide enough that the percentile table fits its card without scrolling.
const wide = { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 };

type Shot = {
  name: string;
  device: object;
  /** Top-level view to open first. */
  view?: "Market & data";
  /** Time frame of the market chart. */
  frame?: string;
  /** Scenario to select before the shot. */
  select?: string;
  /** Element to crop the shot to; the first screen without it. */
  element?: (page: Page) => ReturnType<Page["locator"]>;
};

const card = (title: string) => (page: Page) =>
  page.locator("[data-slot=card]", { hasText: title });

const shots: Shot[] = [
  { name: "home", device: desktop },
  { name: "home-dark", device: { ...desktop, colorScheme: "dark" as const } },
  { name: "home-mobile", device: iPhone },
  { name: "percentiles", device: wide, element: card("Final value after taxes — percentiles") },
  {
    name: "value-explorer",
    device: desktop,
    select: "2× buy and hold",
    element: (page) => page.locator("#value-explorer"),
  },
  {
    name: "slider-insight",
    device: desktop,
    select: "2× buy and hold",
    element: (page) => page.locator("[data-explored]").first(),
  },
  {
    name: "market",
    device: desktop,
    view: "Market & data",
    frame: "Max",
    element: card("Current market"),
  },
];

for (const { name, device, view, frame, select, element } of shots) {
  test.describe(name, () => {
    test.use(device);
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.goto("/");
      if (select)
        await page
          .getByRole("tablist", { name: "Scenarios" })
          .getByRole("tab", { name: select })
          .click();
      // Wait for the simulation and the analysis of the selected scenario.
      await expect(page.getByTestId("explorer-takeaway")).toBeVisible({ timeout: 60_000 });
      await expect(
        page.getByRole("status").filter({ hasText: /Simulating|Analysing/ }),
      ).toHaveCount(0, { timeout: 60_000 });
      if (view) {
        await page.getByRole("tab", { name: view }).click();
        await expect(page.getByText("Data basis", { exact: true })).toBeVisible();
        if (frame) await page.getByRole("tab", { name: frame, exact: true }).click();
      }
      await page.mouse.move(0, 0);
      const path = `docs/screenshots/${name}.png`;
      if (element) await element(page).screenshot({ path });
      else await page.screenshot({ path });
    });
  });
}
