import { dailyBlock, estimatedVariance, monthlyFromDaily, varianceScale } from "@/simulation/daily";
import { leveragedReturn } from "@/simulation/leverage";
import { createRng } from "@/simulation/rng";

const noCosts = { ter: 0, includeSofr: false, financingSpread: 0 };

/** Daily returns with volatility clustering: calm and turbulent regimes of ~21 trading days. */
function clusteredDays(months: number, seed = 7) {
  const rng = createRng(seed);
  const normal = () => {
    const u = Math.max(rng(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  };
  const days: { month: string; r: number }[] = [];
  for (let m = 0; m < months; m++) {
    const month = `${2000 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, "0")}`;
    const dailyVol = rng() < 0.2 ? 0.025 : 0.008;
    for (let d = 0; d < 21; d++) days.push({ month, r: 0.0003 + dailyVol * normal() });
  }
  return days;
}

describe("REQ-010-01 drag from the same month's daily variance", () => {
  test("REQ-010-01 monthly return compounds the days, variance sums squared daily log returns", () => {
    const series = monthlyFromDaily([
      { month: "2000-01", r: 0.01 },
      { month: "2000-01", r: -0.02 },
      { month: "2000-02", r: 0.03 },
    ]);
    expect(series.start).toBe("2000-01");
    expect(series.returns[0]).toBeCloseTo(1.01 * 0.98 - 1, 12);
    expect(series.returns[1]).toBeCloseTo(0.03, 12);
    expect(series.variance[0]).toBeCloseTo(Math.log(1.01) ** 2 + Math.log(0.98) ** 2, 12);
    expect(series.variance[1]).toBeCloseTo(Math.log(1.03) ** 2, 12);
  });

  test("REQ-010-01 rejects gaps between months", () => {
    expect(() =>
      monthlyFromDaily([
        { month: "2000-01", r: 0.01 },
        { month: "2000-03", r: 0.01 },
      ]),
    ).toThrow(/2000-02/);
  });

  test("REQ-010-01 the monthly leveraged return tracks daily compounding within 0.5 %", () => {
    const days = clusteredDays(120);
    const series = monthlyFromDaily(days);
    for (const leverage of [2, 3]) {
      series.returns.forEach((r, i) => {
        const month = series.start.slice(0, 4);
        const label = `${Number(month) + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
        const exact = days
          .filter((d) => d.month === label)
          .reduce((log, d) => log + Math.log1p(leverage * d.r), 0);
        const model = Math.log1p(
          leveragedReturn(
            { r, rate: 0, variance: series.variance[i] ?? 0 },
            { ...noCosts, leverage },
          ),
        );
        expect(Math.abs(model - exact)).toBeLessThan(0.005);
      });
    }
  });
});

describe("REQ-010-02 months without daily data", () => {
  test("REQ-010-02 the scale matches the estimate's total to the realised variance", () => {
    const monthly = [0.02, -0.05, 0.01];
    const realised = [0.001, 0.004, 0.0005];
    const scale = varianceScale(monthly, realised);
    const total = monthly.reduce((a, r) => a + estimatedVariance(r, scale), 0);
    expect(total).toBeCloseTo(0.0055, 12);
  });

  test("REQ-010-02 the estimate is the scaled squared log return of the month", () => {
    expect(estimatedVariance(-0.1, 1.3)).toBeCloseTo(1.3 * Math.log(0.9) ** 2, 12);
  });
});

describe("REQ-015-04 daily index data", () => {
  const days = [
    { month: "2000-01", day: 3, r: 0.01 },
    { month: "2000-01", day: 4, r: -0.02 },
    { month: "2000-02", day: 1, r: 0.03 },
  ];

  test("REQ-015-04 the block holds trading days per month, day of month and daily returns", () => {
    const block = dailyBlock(days);
    expect(block.from).toBe("2000-01");
    expect(block.days).toEqual([2, 1]);
    expect(block.dayOfMonth).toEqual([3, 4, 1]);
    expect(block.returns).toEqual([0.01, -0.02, 0.03]);
  });

  test("REQ-015-04 the daily returns of a month compound to that month's return", () => {
    const monthly = new Map([
      ["2000-01", 0.005],
      ["2000-02", 0.02],
    ]);
    const block = dailyBlock(days, (ym) => monthly.get(ym));
    const compound = (rs: number[]) => rs.reduce((a, r) => a * (1 + r), 1) - 1;
    expect(compound(block.returns.slice(0, 2))).toBeCloseTo(0.005, 12);
    expect(compound(block.returns.slice(2))).toBeCloseTo(0.02, 12);
    // The shape of the month is kept: the second day is still the worse one.
    expect(block.returns[1]).toBeLessThan(block.returns[0] ?? 0);
  });

  test("REQ-015-04 months without a monthly return keep their daily returns", () => {
    const block = dailyBlock(days, (ym) => (ym === "2000-01" ? 0 : undefined));
    expect(block.returns[2]).toBe(0.03);
  });

  test("REQ-015-04 gaps between months are rejected", () => {
    expect(() => dailyBlock([...days, { month: "2000-04", day: 3, r: 0 }])).toThrow(/2000-03/);
  });
});
