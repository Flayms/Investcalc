import { columnHeat, HEAT_RAMP } from "@/features/results/heatmap";

test("REQ-002-03 shades a column from light (lowest) to dark (highest) and marks the best", () => {
  const heat = columnHeat([200, 100, 300]);
  expect(heat.map((h) => h?.best)).toEqual([false, false, true]);
  expect(heat[1]?.background).toBe(HEAT_RAMP[0]);
  expect(heat[2]?.background).toBe(HEAT_RAMP[HEAT_RAMP.length - 1]);
  // The middle value gets a step in between.
  const middle = HEAT_RAMP.indexOf(heat[0]?.background as (typeof HEAT_RAMP)[number]);
  expect(middle).toBeGreaterThan(0);
  expect(middle).toBeLessThan(HEAT_RAMP.length - 1);
});

test("REQ-002-03 no shading with fewer than two values; missing values stay unshaded", () => {
  expect(columnHeat([100])).toEqual([undefined]);
  expect(columnHeat([100, undefined])).toEqual([undefined, undefined]);
  const heat = columnHeat([100, undefined, 50]);
  expect(heat[1]).toBeUndefined();
  expect(heat[0]?.best).toBe(true);
});

test("REQ-002-03 equal values are all best and share one shade", () => {
  const heat = columnHeat([100, 100]);
  expect(heat.every((h) => h?.best)).toBe(true);
  expect(heat[0]?.background).toBe(heat[1]?.background);
});

test("REQ-002-03 dark cells get light text for contrast", () => {
  const heat = columnHeat([0, 1]);
  expect(heat[0]?.dark).toBe(false);
  expect(heat[1]?.dark).toBe(true);
});
