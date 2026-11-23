import { expect, type Locator, type Page, test } from "@playwright/test";

test.use({ colorScheme: "dark" });

/**
 * Lowest WCAG contrast ratio between the tooltip surface and any text in it.
 * Colors go through a canvas so that `oklch(…)` values become RGB.
 */
async function lowestTextContrast(tooltip: Locator): Promise<number> {
  return tooltip
    .locator("> *")
    .first()
    .evaluate((box) => {
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("no canvas");
      const rgb = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a };
      };
      const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const lin = (c: number) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      };
      const surface = rgb(getComputedStyle(box).backgroundColor);
      if (surface.a < 255) throw new Error(`tooltip surface is not opaque: ${surface.a}`);
      const bg = luminance(surface);
      const texts = [box, ...box.querySelectorAll("*")].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()),
      );
      if (texts.length === 0) throw new Error("tooltip has no text");
      return Math.min(
        ...texts.map((el) => {
          const fg = luminance(rgb(getComputedStyle(el).color));
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        }),
      );
    });
}

/** Hovers the chart in the card and returns its visible tooltip. */
async function hover(page: Page, chart: Locator): Promise<Locator> {
  const surface = chart.locator(".recharts-surface").first();
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  if (!box) throw new Error("chart not laid out");
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4);
  const tooltip = chart.locator(".recharts-tooltip-wrapper").first();
  await expect(tooltip).toBeVisible();
  return tooltip;
}

test("REQ-003-05 the market chart tooltip is legible in the dark theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Market & data" }).click();
  const card = page.locator("[data-slot=card]").filter({ hasText: "Current market" });
  const tooltip = await hover(page, card);
  await expect(tooltip).toContainText(/\d+\.\d/);
  expect(await lowestTextContrast(tooltip)).toBeGreaterThanOrEqual(4.5);
});

test("REQ-003-05 the factor impact tooltip is legible in the dark theme", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("[data-slot=card]").filter({ hasText: "What each factor costs" });
  await expect(card.getByText(/Median final value: €/)).toBeVisible({ timeout: 60_000 });
  const tooltip = await hover(page, card);
  await expect(tooltip).toContainText(/Median cost.*€/);
  expect(await lowestTextContrast(tooltip)).toBeGreaterThanOrEqual(4.5);
});
