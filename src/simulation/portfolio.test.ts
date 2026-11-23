import { toMonthDays } from "@/simulation/dataset";
import { defaultScenario, type ScenarioParams } from "@/simulation/params";
import { type PathMonth, type PathResult, RollingSma, simulatePath } from "@/simulation/portfolio";

const w = (r: PathResult, m: number) => r.netWorth[m] ?? Number.NaN;

/** Frictionless scenario: no costs, no taxes, 1× only. */
const plain: ScenarioParams = {
  ...defaultScenario,
  monthlyContribution: 1000,
  initialInvestment: 0,
  leverage: 2,
  leveragedShare: 0,
  terUnleveraged: 0,
  terLeveraged: 0,
  financingSpread: 0,
  bidAskSpread: 0,
  orderFee: 0,
  taxesEnabled: false,
  strategy: "buyAndHold",
  borrowFromFuture: false,
};

const WARMUP = 12;
const months = (n: number, r: number, rate = 0, variance = 0): PathMonth[] =>
  Array.from({ length: n }, () => ({ r, rate, variance }));
const withWarmup = (path: PathMonth[]) => [...months(WARMUP, 0.01), ...path];

describe("REQ-001-11 savings plan (buy and hold)", () => {
  test("REQ-001-11 without returns the final value is the sum of contributions", () => {
    const result = simulatePath(withWarmup(months(24, 0)), WARMUP, {
      ...plain,
      initialInvestment: 5000,
    });
    expect(result.invested).toBe(5000 + 24 * 1000);
    expect(result.finalAfterTax).toBeCloseTo(29_000, 6);
    expect(w(result, 0)).toBeCloseTo(5000, 6);
    expect(w(result, 12)).toBeCloseTo(17_000, 6);
  });

  test("REQ-001-11 contributions at the start of each month compound like an annuity due", () => {
    const r = 0.01;
    const result = simulatePath(withWarmup(months(12, r)), WARMUP, plain);
    const expected = (1000 * (1 + r) * ((1 + r) ** 12 - 1)) / r;
    expect(result.finalAfterTax).toBeCloseTo(expected, 6);
  });
});

describe("REQ-001-07 1× / leveraged mix", () => {
  test("REQ-001-07 the leveraged share of a contribution goes into the leveraged ETF", () => {
    const result = simulatePath(withWarmup(months(1, 0.01)), WARMUP, {
      ...plain,
      leveragedShare: 0.5,
    });
    expect(w(result, 1)).toBeCloseTo(500 * 1.01 + 500 * 1.01 ** 2, 6);
  });
});

describe("REQ-001-08 trading costs", () => {
  test("REQ-001-08 order fee and half the spread are charged on buys and the final sale", () => {
    const result = simulatePath(withWarmup(months(2, 0)), WARMUP, {
      ...plain,
      orderFee: 1,
      bidAskSpread: 0.002,
    });
    const buys = 2 * (1 + 1000 * 0.001);
    const value = 2000 - buys;
    const sale = 1 + value * 0.001;
    expect(result.fees).toBeCloseTo(buys + sale, 6);
    expect(result.finalAfterTax).toBeCloseTo(value - sale, 6);
  });
});

describe("REQ-001-09 / REQ-001-10 taxes in a path", () => {
  const taxed: ScenarioParams = {
    ...plain,
    taxesEnabled: true,
    taxRate: 0.25,
    partialExemption: true,
    allowance: 0,
    baseRate: 0,
  };

  test("REQ-001-09 the final sale is taxed on the gain after partial exemption", () => {
    const result = simulatePath(withWarmup(months(1, 0.1)), WARMUP, {
      ...taxed,
      monthlyContribution: 0,
      initialInvestment: 10_000,
    });
    expect(result.taxes).toBeCloseTo(0.25 * 0.7 * 1000, 6);
    expect(result.finalAfterTax).toBeCloseTo(11_000 - 175, 6);
    // The net worth curve ends before the final sale's taxes.
    expect(w(result, 1)).toBeCloseTo(11_000, 6);
    // The net worth curve ends before the final sale's taxes.
    expect(w(result, 1)).toBeCloseTo(11_000, 6);
  });

  test("REQ-001-10 Vorabpauschale is taxed yearly and not taxed again at sale", () => {
    const params = { ...taxed, monthlyContribution: 0, initialInvestment: 10_000, baseRate: 0.03 };
    const result = simulatePath(withWarmup(months(24, 0.01)), WARMUP, params);
    const noVap = simulatePath(withWarmup(months(24, 0.01)), WARMUP, { ...params, baseRate: 0 });
    // Same total tax base, only paid earlier → tax totals match.
    expect(result.taxes).toBeCloseTo(noVap.taxes, 1);
    expect(w(result, 12)).toBeLessThan(w(noVap, 12));
  });
});

describe("REQ-015-03 SMA timing in months without daily data", () => {
  test("REQ-015-03 sells below the SMA at the month's close, holds cash and re-enters above it", () => {
    const path = withWarmup([
      ...months(1, -0.1),
      ...months(3, -0.1),
      ...months(6, 0.05),
      ...months(12, 0.01),
    ]);
    const result = simulatePath(path, WARMUP, { ...plain, strategy: "sma", smaDays: 210 });
    // After the first loss month the strategy is in cash: later crash months cost nothing.
    const afterExit = w(result, 1);
    expect(w(result, 4)).toBeCloseTo(afterExit + 3000, 6);
    // Buy and hold suffers the full crash.
    const hold = simulatePath(path, WARMUP, plain);
    expect(w(hold, 4)).toBeLessThan(w(result, 4));
    // Eventually invested again: grows in the final steady months.
    expect(w(result, 22)).toBeGreaterThan(w(result, 21) + 1000);
  });

  test("REQ-015-03 signals from monthly-average prices act one month later (no look-ahead)", () => {
    const path = withWarmup([...months(1, -0.1), ...months(3, -0.1), ...months(18, 0.01)]);
    const params = { ...plain, strategy: "sma" as const, smaDays: 210 };
    const prompt = simulatePath(path, WARMUP, params);
    const lagged = simulatePath(path, WARMUP, params, { signalLagMonths: 1 });
    // The lagged strategy still holds ETFs in month 2 and suffers that crash month.
    expect(w(lagged, 2)).toBeLessThan(w(prompt, 2));
    expect(w(lagged, 4)).toBeCloseTo(w(lagged, 2) + 2000, 6);
  });

  test("REQ-015-03 a month without daily data counts as 21 days growing evenly", () => {
    const sma = new RollingSma(21);
    sma.pushMonth(1.21);
    const expected = Array.from({ length: 21 }, (_, j) => 1.21 ** ((j + 1) / 21));
    expect(sma.average).toBeCloseTo(expected.reduce((a, b) => a + b, 0) / 21, 12);
    expect(sma.level).toBeCloseTo(1.21, 12);
    // A longer window averages over the days pushed so far.
    const long = new RollingSma(50);
    long.push(1);
    long.push(3);
    expect(long.average).toBe(2);
  });
});

/** A month of trading days (index returns `rs`, optional daily currency changes `fx`). */
function dayMonth(rs: number[], extra: Partial<PathMonth> = {}, fx?: number[]): PathMonth {
  const logs = rs.map((r) => Math.log1p(r));
  const fxMonth = fx ? fx.reduce((a, x) => a * (1 + x), 1) - 1 : undefined;
  return {
    r: Math.expm1(logs.reduce((a, b) => a + b, 0)),
    rate: 0,
    variance: logs.reduce((a, x) => a + x * x, 0),
    ...(fxMonth === undefined ? {} : { fx: fxMonth }),
    ...extra,
    days: toMonthDays(Float64Array.from(rs), fx ? Float64Array.from(fx) : undefined),
  };
}
const flatDays = (n: number, r: number) => Array.from({ length: n }, () => r);
const dayWarmup = (r: number) => Array.from({ length: WARMUP }, () => dayMonth(flatDays(20, r)));
const lumpSum = { ...plain, initialInvestment: 10_000, monthlyContribution: 0 };
const smaDaily = { ...lumpSum, strategy: "sma" as const, smaDays: 50 };

describe("REQ-015-01 daily signal", () => {
  test("REQ-015-01 a close below the n-day SMA sells at the next trading day's close", () => {
    // Rising index, then a crash on day 5: the fund still takes day 6 (−10 %), not days 7–20.
    const crash = dayMonth([0, 0, 0, 0, -0.3, -0.1, ...flatDays(14, -0.01)]);
    const path = [...dayWarmup(0.001), crash];
    const result = simulatePath(path, WARMUP, smaDaily);
    expect(result.finalAfterTax).toBeCloseTo(10_000 * 0.7 * 0.9, 6);
    const hold = simulatePath(path, WARMUP, lumpSum);
    expect(hold.finalAfterTax).toBeCloseTo(10_000 * 0.7 * 0.9 * 0.99 ** 14, 6);
  });

  test("REQ-015-01 a close above the n-day SMA buys at the next trading day's close", () => {
    // Falling index (out of the market), then a jump on day 3: bought at the close of day 4.
    const jump = dayMonth([0, 0, 0.6, 0.1, ...flatDays(16, 0.01)]);
    const result = simulatePath([...dayWarmup(-0.002), jump], WARMUP, smaDaily);
    expect(result.finalAfterTax).toBeCloseTo(10_000 * 1.01 ** 16, 6);
  });

  test("REQ-015-01 a signal on a month's last day is acted on at the next month's first close", () => {
    const crashAtEnd = dayMonth([...flatDays(19, 0), -0.3]);
    const next = dayMonth([-0.05, ...flatDays(19, -0.01)]);
    const result = simulatePath([...dayWarmup(0.001), crashAtEnd, next], WARMUP, smaDaily);
    expect(result.finalAfterTax).toBeCloseTo(10_000 * 0.7 * 0.95, 6);
  });

  test("REQ-015-01 without a crossing the fund earns the month's return as in buy and hold", () => {
    const path = [...dayWarmup(0.001), dayMonth(flatDays(20, 0.002))];
    const sma = simulatePath(path, WARMUP, smaDaily);
    const hold = simulatePath(path, WARMUP, lumpSum);
    expect(sma.finalAfterTax).toBeCloseTo(hold.finalAfterTax, 6);
  });
});

describe("REQ-015-02 selling or buying within a month", () => {
  test("REQ-015-02 drag, TER and financing for the days held, interest for the days in cash", () => {
    // Crash on day 9, sold at the close of day 10 (+1 %): held 10 of 20 days.
    const month = dayMonth([...flatDays(8, 0), -0.4, 0.01, ...flatDays(10, 0)], { cashRate: 0.12 });
    const params = {
      ...smaDaily,
      leveragedShare: 1,
      leverage: 2,
      terLeveraged: 0.012,
      includeSofr: false,
      financingSpread: 0.024,
    };
    const result = simulatePath([...dayWarmup(0.001), month], WARMUP, params);
    const [a, b] = [Math.log(0.6), Math.log(1.01)];
    const sum = a + b;
    const squares = a ** 2 + b ** 2;
    const held = Math.exp(2 * sum - squares - ((0.024 + 0.012) / 12) * 0.5);
    expect(result.finalAfterTax).toBeCloseTo(10_000 * held * (1 + (0.12 / 12) * 0.5), 6);
  });

  test("REQ-015-02 the gain of a sale within a month is taxed in that year", () => {
    // +80 % in the first month, then a crash on day 5 of the second: sold with a gain of ~8 %.
    const rally = dayMonth(flatDays(20, 0.03));
    const crash = dayMonth([...flatDays(4, 0), -0.4, ...flatDays(15, 0)]);
    const taxed = { ...smaDaily, taxesEnabled: true, allowance: 0, baseRate: 0 };
    const result = simulatePath([...dayWarmup(0.001), rally, crash], WARMUP, taxed);
    const value = 10_000 * 1.03 ** 20 * 0.6;
    expect(value).toBeGreaterThan(10_000);
    const tax = (value - 10_000) * 0.26375 * 0.7;
    expect(result.taxes).toBeCloseTo(tax, 4);
    expect(result.finalAfterTax).toBeCloseTo(value - tax, 4);
  });
});

describe("REQ-015-05 daily exchange rate in the signal", () => {
  test("REQ-015-05 a fall of the dollar within the month can trigger the euro signal", () => {
    // Index flat in USD; the dollar drops 40 % on day 5: sold at the close of day 6.
    const fx = [0, 0, 0, 0, -0.4, -0.05, ...flatDays(14, -0.01)];
    const month = dayMonth(flatDays(20, 0), {}, fx);
    const result = simulatePath([...dayWarmup(0.001), month], WARMUP, smaDaily);
    expect(result.finalAfterTax).toBeCloseTo(10_000 * 0.6 * 0.95, 6);
    const usd = dayMonth(flatDays(20, 0));
    const dollar = simulatePath([...dayWarmup(0.001), usd], WARMUP, smaDaily);
    expect(dollar.finalAfterTax).toBeCloseTo(10_000, 6);
  });
});

describe("REQ-001-13 borrow from your future self", () => {
  const frontLoad = { ...plain, borrowFromFuture: true, loanMonths: 12, loanRate: 0 };

  test("REQ-001-13 without returns and interest it ends like the savings plan", () => {
    const result = simulatePath(withWarmup(months(24, 0)), WARMUP, frontLoad);
    expect(w(result, 0)).toBeCloseTo(0, 6);
    expect(result.finalAfterTax).toBeCloseTo(24_000, 6);
    expect(result.invested).toBe(24_000);
  });

  test("REQ-001-13 rising markets favour investing borrowed money early", () => {
    const path = withWarmup(months(24, 0.01));
    const early = simulatePath(path, WARMUP, frontLoad);
    const plan = simulatePath(path, WARMUP, plain);
    expect(early.finalAfterTax).toBeGreaterThan(plan.finalAfterTax);
  });

  test("REQ-001-13 the loan is repaid with the first K contributions incl. interest", () => {
    const result = simulatePath(withWarmup(months(24, 0)), WARMUP, {
      ...frontLoad,
      loanRate: 0.06,
    });
    const i = 0.005;
    const principal = (1000 * (1 - (1 + i) ** -12)) / i;
    expect(result.finalAfterTax).toBeCloseTo(principal + 12_000, 4);
  });
});

describe("REQ-011-01 currency effect", () => {
  const inEur = (n: number, r: number, fx: number, cashRate = 0): PathMonth[] =>
    Array.from({ length: n }, () => ({ r, rate: 0, variance: 0, fx, cashRate }));

  test("REQ-011-01 a fund's return is converted with the month's exchange rate change", () => {
    const result = simulatePath(withWarmup(inEur(1, 0.01, 0.05)), WARMUP, plain);
    expect(result.finalAfterTax).toBeCloseTo(1000 * 1.01 * 1.05, 6);
  });

  test("REQ-011-02 the currency effect of a leveraged ETF is not leveraged", () => {
    const result = simulatePath(withWarmup(inEur(1, 0.01, 0.05)), WARMUP, {
      ...plain,
      leveragedShare: 1,
      leverage: 3,
      includeSofr: false,
    });
    expect(result.finalAfterTax).toBeCloseTo(1000 * 1.01 ** 3 * 1.05, 6);
  });

  test("REQ-011-03 cash earns the cash rate of the month", () => {
    // SMA strategy out of the market: index falling, so the contribution stays in cash.
    const result = simulatePath([...months(WARMUP, -0.01), ...inEur(1, -0.01, 0, 0.12)], WARMUP, {
      ...plain,
      strategy: "sma",
    });
    expect(result.finalAfterTax).toBeCloseTo(1000 * 1.01, 6);
  });

  test("REQ-011-05 the SMA signal follows the index level in the chosen currency", () => {
    // Flat index in USD, but the dollar falls 2 % a month: in euros the index is below its SMA.
    const path = [...inEur(WARMUP, 0, -0.02), ...inEur(1, 0, -0.02)];
    const result = simulatePath(path, WARMUP, { ...plain, strategy: "sma" });
    expect(result.finalAfterTax).toBeCloseTo(1000, 6);
  });
});

describe("REQ-013-01 inflation-adjusted results", () => {
  const inflating = (n: number, r: number, inflation: number): PathMonth[] =>
    Array.from({ length: n }, () => ({ r, rate: 0, variance: 0, inflation }));
  const lump = { ...plain, initialInvestment: 1000, monthlyContribution: 0 };

  test("REQ-013-01 amounts are deflated with the price level of their month", () => {
    const path = withWarmup(inflating(12, 0.01, 0.01));
    const real = simulatePath(path, WARMUP, { ...lump, inflationAdjusted: true });
    const nominal = simulatePath(path, WARMUP, { ...lump, inflationAdjusted: false });
    expect(nominal.finalAfterTax).toBeCloseTo(1000 * 1.01 ** 12, 6);
    expect(real.finalAfterTax).toBeCloseTo(1000, 6);
    expect(w(real, 6)).toBeCloseTo(1000, 6);
    expect(w(nominal, 6)).toBeCloseTo(1000 * 1.01 ** 6, 6);
  });

  test("REQ-013-03 each payment counts with its purchasing power when it was made", () => {
    const path = withWarmup(inflating(3, 0, 0.01));
    const real = simulatePath(path, WARMUP, { ...plain, inflationAdjusted: true });
    expect(real.invested).toBeCloseTo(1000 + 1000 / 1.01 + 1000 / 1.01 ** 2, 6);
    expect(real.paidIn[3]).toBeCloseTo(real.invested, 6);
    const nominal = simulatePath(path, WARMUP, { ...plain, inflationAdjusted: false });
    expect(nominal.invested).toBe(3000);
    expect(nominal.paidIn[2]).toBe(2000);
  });

  test("REQ-013-04 taxes are computed on nominal gains", () => {
    const path = withWarmup(inflating(12, 0.01, 0.01));
    const taxed = { ...lump, initialInvestment: 100_000, taxesEnabled: true, baseRate: 0 };
    const real = simulatePath(path, WARMUP, { ...taxed, inflationAdjusted: true });
    const nominal = simulatePath(path, WARMUP, { ...taxed, inflationAdjusted: false });
    expect(nominal.taxes).toBeGreaterThan(0);
    expect(real.taxes).toBeCloseTo(nominal.taxes / 1.01 ** 12, 6);
    expect(real.finalAfterTax).toBeCloseTo(nominal.finalAfterTax / 1.01 ** 12, 6);
    expect(real.finalAfterTax).toBeLessThan(100_000);
  });
});
