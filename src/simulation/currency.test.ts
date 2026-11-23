import { dailyFx, inCurrency } from "@/simulation/currency";
import type { CurrencyData, Dataset } from "@/simulation/dataset";
import { defaultGlobal, defaultScenario } from "@/simulation/params";
import { buildPaths } from "@/simulation/simulate";

const n = (length: number, f: (i: number) => number) => Array.from({ length }, (_, i) => f(i));

const usd: Dataset = {
  id: "x",
  name: "X",
  description: "",
  source: "",
  currency: "USD",
  priceType: "close",
  start: "1950-01",
  returns: n(240, (i) => i / 10_000),
  rates: n(240, () => 0.05),
  variance: n(240, () => 0.002),
  inflation: n(240, () => 0.004),
};

const eur: CurrencyData = {
  id: "eur",
  name: "Euro",
  source: "",
  start: "1960-01",
  fx: n(300, (i) => -i / 100_000),
  rates: n(300, () => 0.03),
  inflation: n(300, () => 0.002),
};

describe("REQ-011-04 history in euros", () => {
  test("REQ-011-04 only months with an exchange rate are used", () => {
    const d = inCurrency(usd, eur);
    expect(d.currency).toBe("EUR");
    expect(d.start).toBe("1960-01");
    expect(d.returns).toHaveLength(120);
    expect(d.returns[0]).toBe(usd.returns[120]);
    expect(d.variance[0]).toBe(usd.variance[120]);
    expect(d.rates[0]).toBe(0.05);
    expect(d.fx?.[0]).toBe(eur.fx[0]);
    expect(d.fx?.[119]).toBe(eur.fx[119]);
    expect(d.cashRates?.[0]).toBe(0.03);
  });

  test("REQ-011-04 months after the last exchange rate are dropped", () => {
    const short = {
      ...eur,
      start: "1955-01",
      fx: n(24, () => 0.01),
      rates: n(24, () => 0.03),
      inflation: n(24, () => 0.002),
    };
    const d = inCurrency(usd, short);
    expect(d.start).toBe("1955-01");
    expect(d.returns).toHaveLength(24);
    expect(d.fx).toHaveLength(24);
  });
});

describe("REQ-011-01 currency setting", () => {
  test("REQ-011-01 path months carry the same month's exchange rate change and cash rate", () => {
    const d = inCurrency(usd, eur);
    const scenario = { ...defaultScenario, fromYear: 1960, toYear: 1969 };
    const { paths } = buildPaths(d, scenario, {
      ...defaultGlobal,
      horizonYears: 2,
      sampling: "rolling",
    });
    paths[7]?.forEach((month, k) => {
      expect(month.r).toBe(d.returns[7 + k]);
      expect(month.fx).toBe(d.fx?.[7 + k]);
      expect(month.cashRate).toBe(0.03);
      expect(month.rate).toBe(0.05);
    });
  });

  test("REQ-011-01 in US dollars there is no currency effect and cash earns the US rate", () => {
    const { paths } = buildPaths(
      usd,
      { ...defaultScenario, fromYear: 1950 },
      {
        ...defaultGlobal,
        horizonYears: 2,
        sampling: "rolling",
      },
    );
    expect(paths[0]?.[0]?.fx).toBe(0);
    expect(paths[0]?.[0]?.cashRate).toBe(0.05);
  });
});

describe("REQ-013-02 inflation of the investor's currency", () => {
  const scenario = { ...defaultScenario, fromYear: 1950 };
  const global = { ...defaultGlobal, horizonYears: 2, sampling: "rolling" as const };

  test("REQ-013-02 euro paths carry German inflation, dollar paths US inflation", () => {
    expect(buildPaths(inCurrency(usd, eur), scenario, global).paths[0]?.[0]?.inflation).toBe(0.002);
    expect(buildPaths(usd, scenario, global).paths[0]?.[0]?.inflation).toBe(0.004);
  });
});

describe("REQ-015-05 daily exchange rate", () => {
  test("REQ-015-05 each trading day uses the last fixing on or before it", () => {
    // Fixings on the 2nd (+1 %), 5th (+2 %) and 30th (−1 %); trading days 1, 5, 6 and 29.
    const fx = dailyFx([1, 5, 6, 29], [2, 5, 30], [0.01, 0.02, -0.01]);
    expect(fx[0]).toBeCloseTo(0, 12); // day 1: still the previous month's last fixing
    expect(fx[1]).toBeCloseTo(1.01 * 1.02 - 1, 12); // day 5: fixings of the 2nd and 5th
    expect(fx[2]).toBeCloseTo(0, 12);
    // Last trading day of the month: up to the month's last fixing.
    expect(fx[3]).toBeCloseTo(-0.01, 12);
  });

  test("REQ-015-05 a month's daily changes compound to the month's change", () => {
    const changes = [0.01, -0.004, 0.02];
    const fx = dailyFx([3, 10, 17, 24], [4, 11, 31], changes);
    const day = fx.reduce((a, x) => a * (1 + x), 1);
    const month = changes.reduce((a, x) => a * (1 + x), 1);
    expect(day).toBeCloseTo(month, 12);
  });

  test("REQ-015-05 euro datasets carry the daily changes of their months", () => {
    const daily: Dataset = {
      ...usd,
      daily: {
        from: "1959-12",
        days: n(3, () => 2),
        dayOfMonth: n(6, (i) => (i % 2 ? 20 : 5)),
        returns: n(6, (i) => i / 1000),
      },
    };
    const withDays: CurrencyData = {
      ...eur,
      daily: { days: n(300, () => 1), dayOfMonth: n(300, () => 10), fx: n(300, () => 0.01) },
    };
    const d = inCurrency(daily, withDays);
    expect(d.daily?.from).toBe("1960-01");
    expect(d.daily?.days).toEqual([2, 2]);
    expect(d.daily?.returns).toEqual([0.002, 0.003, 0.004, 0.005]);
    expect(d.daily?.fx?.[0]).toBeCloseTo(0, 12);
    expect(d.daily?.fx?.[1]).toBeCloseTo(0.01, 12);
  });
});
