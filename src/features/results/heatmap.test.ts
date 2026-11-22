import { columnHeat, HEAT_RAMP, heatStyle } from "@/features/results/heatmap";

test("REQ-002-03 shades a column from light (lowest) to dark (highest) and marks the best", () => {
  const heat = columnHeat([200, 100, 300]);
  expect(heat.map((h) => h?.best)).toEqual([false, false, true]);
  expect(heat[1]?.step).toBe(0);
  expect(heat[2]?.step).toBe(HEAT_RAMP.length - 1);
  // The middle value gets a step in between.
  const middle = heat[0]?.step as number;
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
  expect(heat[0]?.step).toBe(heat[1]?.step);
});

test("REQ-002-03 each step has its own background and text color for contrast", () => {
  const [low, high] = columnHeat([0, 1]);
  expect(heatStyle(low as NonNullable<typeof low>)).toEqual({
    background: "var(--heat-0)",
    color: "var(--heat-ink-0)",
  });
  expect(heatStyle(high as NonNullable<typeof high>).color).toBe(
    `var(--heat-ink-${HEAT_RAMP.length - 1})`,
  );
});
