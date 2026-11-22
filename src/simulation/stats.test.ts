import { percentile } from "@/simulation/stats";

test("REQ-001-14 percentile interpolates linearly between sorted values", () => {
  const sorted = [1, 2, 3, 4, 5];
  expect(percentile(sorted, 0)).toBe(1);
  expect(percentile(sorted, 0.5)).toBe(3);
  expect(percentile(sorted, 1)).toBe(5);
  expect(percentile(sorted, 0.1)).toBeCloseTo(1.4, 10);
});
