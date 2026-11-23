import { defaultScenario, type ScenarioParams } from "@/simulation/params";
import { type PathMonth, type PathResult, simulatePath } from "@/simulation/portfolio";

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

describe("REQ-001-12 SMA timing", () => {
  test("REQ-001-12 sells below the SMA, holds cash and re-enters above it", () => {
    const path = withWarmup([
      ...months(1, -0.1),
      ...months(3, -0.1),
      ...months(6, 0.05),
      ...months(12, 0.01),
    ]);
    const result = simulatePath(path, WARMUP, { ...plain, strategy: "sma", smaMonths: 10 });
    // After the first loss month the strategy is in cash: later crash months cost nothing.
    const afterExit = w(result, 1);
    expect(w(result, 4)).toBeCloseTo(afterExit + 3000, 6);
    // Buy and hold suffers the full crash.
    const hold = simulatePath(path, WARMUP, plain);
    expect(w(hold, 4)).toBeLessThan(w(result, 4));
    // Eventually invested again: grows in the final steady months.
    expect(w(result, 22)).toBeGreaterThan(w(result, 21) + 1000);
  });
});

describe("REQ-001-12 SMA timing on averaged prices", () => {
  test("REQ-001-12 signals from monthly-average prices act one month later (no look-ahead)", () => {
    const path = withWarmup([...months(1, -0.1), ...months(3, -0.1), ...months(18, 0.01)]);
    const params = { ...plain, strategy: "sma" as const, smaMonths: 10 };
    const prompt = simulatePath(path, WARMUP, params);
    const lagged = simulatePath(path, WARMUP, params, { signalLagMonths: 1 });
    // The lagged strategy still holds ETFs in month 2 and suffers that crash month.
    expect(w(lagged, 2)).toBeLessThan(w(prompt, 2));
    expect(w(lagged, 4)).toBeCloseTo(w(lagged, 2) + 2000, 6);
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
