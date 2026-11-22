import { formatDuration, formatGain } from "@/lib/format";

test("REQ-006-04 durations below two years in months, else in years", () => {
  expect(formatDuration(23)).toBe("23 mo");
  expect(formatDuration(30)).toBe("2.5 y");
});

test("REQ-006-03 large gains are shown as a multiple", () => {
  expect(formatGain(0.123)).toBe("+12.3 %");
  expect(formatGain(-0.5)).toBe("-50.0 %");
  expect(formatGain(1.6)).toBe("+160 %");
  expect(formatGain(13)).toBe("×14");
});
