import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test.describe("REQ-001-21 readable on phones", () => {
  test("REQ-001-21 no sideways scrolling and no text below 12 px", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("explorer-takeaway")).toBeVisible({ timeout: 60_000 });
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
    for (const name of ["1× buy and hold", "2× buy and hold", "2× with 200-day SMA"]) {
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

  test("REQ-006-04 the bear market table fits on a phone", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Market & data" }).click();
    await page.getByRole("tab", { name: "Max", exact: true }).click();
    const table = page.getByRole("table").first();
    await expect(table.getByRole("row", { name: /1929-08/ })).toBeVisible();
    const box = await table.boundingBox();
    const parent = await table.evaluate((el) => el.parentElement?.clientWidth ?? 0);
    expect(box?.width ?? 0).toBeLessThanOrEqual(parent);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("REQ-005-01 / REQ-005-05 scenarios can be reordered by touch (press and hold)", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Scenarios" });
  await page.getByRole("tab", { name: "Settings" }).tap();
  const from = await tabs.getByRole("tab", { name: "2× with 200-day SMA" }).boundingBox();
  const to = await tabs.getByRole("tab", { name: "1× buy and hold" }).boundingBox();
  if (!from || !to) throw new Error("tabs not laid out");
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + 4, y: to.y + to.height / 2 };
  await touch("touchStart", start.x, start.y);
  await page.waitForTimeout(400);
  for (let i = 1; i <= 15; i++) {
    await touch(
      "touchMove",
      start.x + ((end.x - start.x) * i) / 15,
      start.y + ((end.y - start.y) * i) / 15,
    );
  }
  await touch("touchEnd", end.x, end.y);
  await expect(tabs.getByRole("tab")).toHaveText([
    "2× with 200-day SMA",
    "1× buy and hold",
    "2× buy and hold",
  ]);
});

test.describe("REQ-014-01 German on phones", () => {
  test.use({ locale: "de-DE" });
  for (const view of ["Ergebnisse", "Einstellungen"]) {
    test(`REQ-014-01 the longer German text causes no sideways scrolling (${view})`, async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByTestId("explorer-takeaway")).toBeVisible({ timeout: 60_000 });
      await page.getByRole("tab", { name: view }).click();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
