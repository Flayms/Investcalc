import { createFormat } from "@/lib/format";

const en = createFormat("en");
const de = createFormat("de");
/** Intl puts a no-break space between number and unit in German; compare with plain spaces. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

test("REQ-006-04 durations below two years in months, else in years", () => {
  expect(en.duration(23)).toBe("23 mo");
  expect(en.duration(30)).toBe("2.5 y");
});

test("REQ-006-03 large gains are shown as a multiple", () => {
  expect(en.gain(0.123)).toBe("+12.3 %");
  expect(en.gain(-0.5)).toBe("-50.0 %");
  expect(en.gain(1.6)).toBe("+160 %");
  expect(en.gain(13)).toBe("×14");
});

test("REQ-012-04 English numbers stay as before", () => {
  expect(en.euro(1234.4)).toBe("€1,234");
  expect(en.euroCompact(1_234_567)).toBe("€1.2M");
  expect(en.percent(0.1234)).toBe("12.3 %");
  expect(en.percent(0.1234, 0)).toBe("12 %");
  expect(en.signedPercent(0.05)).toBe("+5.0 %");
  expect(en.factor(2)).toBe("2.00×");
  expect(en.compact(12_300)).toBe("12.3K");
  expect(en.count(2000)).toBe("2,000");
  expect(en.number(1.5, 1)).toBe("1.5");
});

test("REQ-012-04 German numbers use German formatting", () => {
  expect(plain(de.euro(1234.4))).toBe("1.234 €");
  expect(plain(de.euroCompact(1_234_567))).toBe("1,2 Mio. €");
  // Intl does not abbreviate German thousands ("800.000 €"), too wide for chart axes.
  expect(plain(de.euroCompact(800_000))).toBe("800 Tsd. €");
  expect(plain(de.euroCompact(850))).toBe("850 €");
  expect(plain(de.compact(12_300))).toBe("12,3 Tsd.");
  expect(de.compact(500)).toBe("500");
  expect(de.gain(13)).toBe("×14");
  expect(de.percent(0.1234)).toBe("12,3 %");
  expect(de.percent(0.1234, 0)).toBe("12 %");
  expect(de.signedPercent(0.05)).toBe("+5,0 %");
  expect(de.signedPercent(-0.05)).toBe("-5,0 %");
  expect(de.factor(2)).toBe("2,00×");
  expect(de.duration(8)).toBe("8 Mon.");
  expect(de.duration(18)).toBe("18 Mon.");
  expect(de.duration(30)).toBe("2,5 J.");
  expect(de.gain(0.123)).toBe("+12,3 %");
  expect(de.gain(13)).toBe("×14");
  expect(de.count(2000)).toBe("2.000");
  expect(de.number(1.5, 1)).toBe("1,5");
});
