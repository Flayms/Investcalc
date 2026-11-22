import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test.describe("REQ-001-21 readable on phones", () => {
  test("REQ-001-21 no sideways scrolling and no text below 12 px", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("leverage-takeaway")).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const tooSmall = await page.evaluate(() => {
      const small: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const el = node.parentElement;
        if (!el || !node.textContent?.trim()) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const size = Number.parseFloat(getComputedStyle(el).fontSize);
        if (size < 12) small.push(`${size}px: ${node.textContent.trim().slice(0, 30)}`);
      }
      return small;
    });
    expect(tooSmall).toEqual([]);
  });

  test("REQ-001-21 results first, settings one tap away", async ({ page }) => {
    await page.goto("/");
    const results = page.getByRole("tab", { name: "Results" });
    await expect(results).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Scenario settings")).toBeHidden();
    // Percentiles of every scenario are visible without horizontal scrolling.
    for (const name of ["1× buy and hold", "2× buy and hold", "2× with 10-month SMA"]) {
      const card = page.getByRole("article", { name });
      await expect(card.getByText("P50")).toBeVisible({ timeout: 30_000 });
      const box = await card.boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    }
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByText("Scenario settings")).toBeVisible();
    await expect(page.getByText("Net worth over time")).toBeHidden();
  });

  test("REQ-001-17 help opens on tap", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Settings" }).click();
    const info = page.getByRole("button", { name: "About TER 1× ETF" });
    // iOS Safari does not focus buttons on tap: make sure the tooltip does not depend on focus.
    await info.evaluate((el) => el.addEventListener("focus", () => (el as HTMLElement).blur()));
    await info.tap();
    await expect(page.getByRole("tooltip")).toContainText("Recommended:");
  });
});
