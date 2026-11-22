import { test } from "@playwright/test";

const pages = [{ name: "home", path: "/" }];

for (const { name, path } of pages) {
  test(`screenshot: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  });
}
