import type { Dataset } from "@/simulation/dataset";
import {
  bearMarkets,
  bullMarkets,
  chartSeries,
  indicators,
  marketStatus,
  periodStats,
  timeFrames,
} from "@/simulation/market";

const dataset = (returns: number[]): Dataset => ({
  id: "x",
  name: "X",
  description: "",
  source: "",
  currency: "USD",
  priceType: "close",
  start: "2000-01",
  returns,
  rates: returns.map(() => 0.02),
  variance: returns.map(() => 0.002),
});

describe("REQ-001-18 market status", () => {
  test("REQ-001-18 steady growth is a bull market above all SMAs", () => {
    const status = marketStatus(dataset(Array(24).fill(0.01)));
    expect(status.phase).toBe("bull");
    expect(status.lastMonth).toBe("2001-12");
    expect(status.drawdown).toBeCloseTo(0, 10);
    expect(status.smas.every((s) => s.above)).toBe(true);
  });

  test("REQ-001-18 a 25 % drop from the high is a bear market below its SMAs", () => {
    const status = marketStatus(dataset([...Array(24).fill(0.01), -0.25]));
    expect(status.phase).toBe("bear");
    expect(status.drawdown).toBeCloseTo(-0.25, 10);
    expect(status.smas.every((s) => !s.above)).toBe(true);
  });

  test("REQ-001-18 a 12 % drop is a correction", () => {
    expect(marketStatus(dataset([...Array(24).fill(0.01), -0.12])).phase).toBe("correction");
  });
});

describe("REQ-006 market history", () => {
  // 12 months +1 %, a 30 % crash over 3 months, recovery, then a 25 % crash that is still ongoing.
  const crash = [-0.1, -0.1, -0.135802];
  const history = [...Array(12).fill(0.01), ...crash, ...Array(40).fill(0.02), -0.15, -0.12];

  test("REQ-006-01 the chart covers the time frame, rebased to 100, with its SMA", () => {
    const series = chartSeries(dataset(Array(36).fill(0.01)), 12, 10);
    expect(series).toHaveLength(12);
    expect(series[0]?.month).toBe("2002-01");
    expect(series[0]?.index).toBeCloseTo(100, 10);
    expect(series[11]?.index).toBeCloseTo(100 * 1.01 ** 11, 8);
    expect(series[11]?.sma).toBeLessThan(series[11]?.index ?? 0);
  });

  test("REQ-006-01 a time frame longer than the history shows the whole history", () => {
    expect(chartSeries(dataset(Array(36).fill(0.01)), 600, 10)).toHaveLength(36);
  });

  test("REQ-006-01 time frames longer than the history are not available", () => {
    const frames = timeFrames(dataset(Array(25 * 12).fill(0.01)));
    expect(frames.filter((f) => f.available).map((f) => f.label)).toEqual([
      "1Y",
      "3Y",
      "5Y",
      "10Y",
      "20Y",
      "Max",
    ]);
    expect(frames.find((f) => f.label === "50Y")?.available).toBe(false);
  });

  test("REQ-006-03 statistics of the time frame", () => {
    const s = periodStats(dataset([...Array(12).fill(0), 0.1, -0.5, 0.21]), 3);
    expect(s.from).toBe("2001-01");
    expect(s.to).toBe("2001-03");
    expect(s.totalReturn).toBeCloseTo(1.1 * 0.5 * 1.21 - 1, 10);
    expect(s.cagr).toBeCloseTo((1.1 * 0.5 * 1.21) ** 4 - 1, 10);
    expect(s.maxDrawdown).toBeCloseTo(-0.5, 10);
    expect(s.volatility).toBeGreaterThan(0);
  });

  test("REQ-006-04 declines of 20 % or more from the all-time high are bear markets", () => {
    const bears = bearMarkets(dataset(history));
    expect(bears).toHaveLength(2);
    const [first, second] = bears;
    expect(first).toMatchObject({ peak: "2000-12", trough: "2001-03", monthsDown: 3 });
    expect(first?.decline).toBeCloseTo(-0.3, 5);
    expect(first?.recovered).not.toBeNull();
    expect(first?.monthsToRecover).toBe((first?.recoveredIndex ?? 0) - (first?.peakIndex ?? 0));
    expect(second?.recovered).toBeNull();
    expect(second?.monthsToRecover).toBeNull();
    expect(second?.decline).toBeCloseTo(0.85 * 0.88 - 1, 5);
  });

  test("REQ-006-04 a 15 % dip is not a bear market", () => {
    expect(bearMarkets(dataset([...Array(12).fill(0.01), -0.15, ...Array(30).fill(0.02)]))).toEqual(
      [],
    );
  });

  test("REQ-006-05 bull markets run from a bear market's trough to the next peak", () => {
    const bulls = bullMarkets(dataset(history));
    expect(bulls.past).toHaveLength(1);
    expect(bulls.past[0]).toMatchObject({ start: "2001-03", end: "2004-07", months: 40 });
    expect(bulls.past[0]?.gain).toBeCloseTo(1.02 ** 40 - 1, 8);
    // A bear market is ongoing, so there is no current bull market.
    expect(bulls.current).toBeNull();
  });

  test("REQ-006-05 the current bull market starts at the last trough", () => {
    const bulls = bullMarkets(
      dataset([...Array(12).fill(0.01), ...crash, ...Array(40).fill(0.02)]),
    );
    expect(bulls.past).toHaveLength(0);
    expect(bulls.current).toMatchObject({ start: "2001-03", end: null, months: 40 });
    expect(bulls.current?.gain).toBeCloseTo(1.02 ** 40 - 1, 8);
  });

  test("REQ-006-06 trailing returns, recent volatility and the short rate", () => {
    const ind = indicators(dataset(Array(48).fill(0.01)));
    expect(ind.trailing.map((t) => t.years)).toEqual([1, 3, 5, 10]);
    expect(ind.trailing[0]?.cagr).toBeCloseTo(1.01 ** 12 - 1, 10);
    expect(ind.trailing[1]?.cagr).toBeCloseTo(1.01 ** 12 - 1, 10);
    expect(ind.trailing[2]?.cagr).toBeNull();
    expect(ind.volatility12m).toBeCloseTo(0, 10);
    expect(ind.volatilityLongTerm).toBeCloseTo(0, 10);
    expect(ind.shortRate).toBe(0.02);
  });
});
