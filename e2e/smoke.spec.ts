import { expect, test } from "@playwright/test";

test("app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Investcalc" })).toBeVisible();
});

test("REQ-001-14 simulates the default scenarios in a worker and shows percentiles", async ({
  page,
}) => {
  await page.goto("/");
  const table = page.getByRole("table").filter({ hasText: "P(loss)" });
  await expect(table.getByRole("columnheader", { name: "P50" })).toBeVisible();
  // Three default scenarios, each with 2,000 paths.
  await expect(table.getByRole("cell", { name: "2,000", exact: true })).toHaveCount(3, {
    timeout: 30_000,
  });
  await expect(page.getByText("Net worth over time")).toBeVisible();
});

test("REQ-008-01 / REQ-001-20 analyses the selected scenario", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("explorer-takeaway")).toHaveText(
    /\d\.\d\d× has the highest median/,
    {
      timeout: 60_000,
    },
  );
  await expect(page.getByText(/Median final value: €/)).toBeVisible();
});

test("REQ-001-03 historical windows on a short history explain why there is no result", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Path generation" }).click();
  await page.getByRole("option", { name: "Historical windows" }).click();
  await page.getByRole("combobox", { name: "Index" }).click();
  await page.getByRole("option", { name: "MSCI ACWI (All World)" }).click();
  // ACWI has about 38 years of history: a 50-year horizon does not fit.
  await page.getByRole("slider", { name: "Horizon" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("table").getByText(/is shorter than the horizon/)).toBeVisible({
    timeout: 30_000,
  });
});

test("REQ-002-01 scenarios survive a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Duplicate/ }).click();
  await page.getByLabel("Name").fill("Kept after reload");
  await page.reload();
  const tabs = page.getByRole("tablist", { name: "Scenarios" });
  await expect(tabs.getByRole("tab")).toHaveCount(4);
  await expect(tabs.getByRole("tab", { selected: true })).toHaveText("Kept after reload");
});

test("REQ-002-05 market and data basis are on their own view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Current market")).toHaveCount(0);
  await page.getByRole("tab", { name: "Market & data" }).click();
  await expect(page.getByText("Current market")).toBeVisible();
  await expect(page.getByText("Data basis")).toBeVisible();
});

const order = ["2× with 10-month SMA", "1× buy and hold", "2× buy and hold"];

test("REQ-005-01 scenarios can be reordered by mouse drag and the order survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Scenarios" });
  const from = await tabs.getByRole("tab", { name: "2× with 10-month SMA" }).boundingBox();
  const to = await tabs.getByRole("tab", { name: "1× buy and hold" }).boundingBox();
  if (!from || !to) throw new Error("tabs not laid out");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + 4, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(tabs.getByRole("tab")).toHaveText(order);
  await page.reload();
  await expect(tabs.getByRole("tab")).toHaveText(order);
});

test("REQ-005-04 scenarios can be reordered with the keyboard", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Scenarios" });
  // Each step is announced to screen readers; waiting for it also waits for dnd-kit's measuring.
  const announced = page.locator("[id^=DndLiveRegion]");
  await page.getByRole("button", { name: "Reorder 2× with 10-month SMA" }).focus();
  await page.keyboard.press("Space");
  await expect(announced).toHaveText(/Picked up 2× with 10-month SMA, position 3 of 3/);
  // dnd-kit measures the tabs in the frame after pick-up; a person never types faster than that.
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowLeft");
  await expect(announced).toHaveText(/moved to position 2/);
  await page.keyboard.press("ArrowLeft");
  await expect(announced).toHaveText(/moved to position 1/);
  await page.keyboard.press("Space");
  await expect(tabs.getByRole("tab")).toHaveText(order);
  // Escape cancels.
  await page.getByRole("button", { name: "Reorder 1× buy and hold" }).focus();
  await page.keyboard.press("Space");
  await expect(announced).toHaveText(/Picked up 1× buy and hold/);
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowRight");
  await expect(announced).toHaveText(/moved to position 3/);
  await page.keyboard.press("Escape");
  await expect(announced).toHaveText(/cancelled/);
  await expect(tabs.getByRole("tab")).toHaveText(order);
});

test("REQ-005-05 a click selects without moving", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Scenarios" });
  await tabs.getByRole("tab", { name: "2× buy and hold" }).click();
  await expect(tabs.getByRole("tab", { selected: true })).toHaveText("2× buy and hold");
  await expect(tabs.getByRole("tab")).toHaveText([
    "1× buy and hold",
    "2× buy and hold",
    "2× with 10-month SMA",
  ]);
});

test("REQ-009-01 the status stays in view while scrolled down", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("explorer-takeaway")).toBeVisible({ timeout: 60_000 });
  await page.getByText("What each factor costs").scrollIntoViewIfNeeded();
  // Change a setting without scrolling up to it.
  await page
    .getByRole("slider", { name: "Horizon" })
    .evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press("ArrowRight");
  const status = page.getByRole("status").filter({ hasText: /Simulating 3 scenarios/ });
  await expect(status).toBeInViewport();
  await expect(page.getByRole("status").filter({ hasText: /Simulating|Analysing/ })).toHaveCount(
    0,
    {
      timeout: 60_000,
    },
  );
});

test("REQ-011-01 switching the currency to US dollars recalculates the scenarios", async ({
  page,
}) => {
  await page.goto("/");
  const table = page.getByRole("table").filter({ hasText: "P(loss)" });
  await expect(table.getByRole("cell", { name: "2,000", exact: true })).toHaveCount(3, {
    timeout: 30_000,
  });
  await expect(page.getByText(/In euros from 1960/)).toBeVisible();
  const inEuros = await table.textContent();
  await page.getByRole("combobox", { name: "Currency" }).click();
  await page.getByRole("option", { name: "US dollar" }).click();
  await expect(page.getByText(/In euros from 1960/)).toHaveCount(0);
  await expect.poll(() => table.textContent(), { timeout: 30_000 }).not.toBe(inEuros);
});
