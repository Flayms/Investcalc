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
  await expect(page.getByText(/Highest median: \d\.\d\d×/)).toBeVisible({ timeout: 60_000 });
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
