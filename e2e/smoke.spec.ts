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
  await expect(table.getByRole("cell", { name: "2,000" })).toHaveCount(3, { timeout: 30_000 });
  await expect(page.getByText("Net worth over time")).toBeVisible();
});

test("REQ-001-16 / REQ-001-20 analyses the selected scenario", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("leverage-takeaway")).toHaveText(
    /\d\.\d\d× (\(no leverage\) )?has the highest median/,
    { timeout: 60_000 },
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
  await page.getByRole("option", { name: "MSCI World" }).click();
  await page.getByRole("slider", { name: "Horizon" }).focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
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
