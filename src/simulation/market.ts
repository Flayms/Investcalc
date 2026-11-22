import { type Dataset, datasetStats, monthLabel } from "@/simulation/dataset";

export type MarketPhase = "bull" | "correction" | "bear";

export type MarketStatus = {
  lastMonth: string;
  phase: MarketPhase;
  /** Drop from the all-time high (≤ 0). */
  drawdown: number;
  smas: { months: number; value: number; above: boolean; distance: number }[];
  /** Total return index level (start = 1). */
  level: number;
};

export const SMA_WINDOWS = [6, 10, 12] as const;
/** Decline from the all-time high that makes a bear market. */
export const BEAR_THRESHOLD = -0.2;

/** Total return index level at the end of each month (1 before the first month). */
export function indexLevels(dataset: Pick<Dataset, "returns">): number[] {
  const levels: number[] = [];
  let level = 1;
  for (const r of dataset.returns) {
    level *= 1 + r;
    levels.push(level);
  }
  return levels;
}

export function marketStatus(dataset: Dataset): MarketStatus {
  const levels = indexLevels(dataset);
  const level = levels.at(-1) ?? 1;
  const high = Math.max(1, ...levels);
  const drawdown = level / high - 1;
  const smas = SMA_WINDOWS.map((months) => {
    const window = levels.slice(-months);
    const value = window.reduce((a, b) => a + b, 0) / window.length;
    return { months, value, above: level >= value, distance: level / value - 1 };
  });
  const phase: MarketPhase =
    drawdown <= BEAR_THRESHOLD ? "bear" : drawdown <= -0.1 ? "correction" : "bull";
  return {
    lastMonth: monthLabel(dataset, dataset.returns.length - 1),
    phase,
    drawdown,
    smas,
    level,
  };
}

export type TimeFrame = { label: string; months: number; available: boolean };

const TIME_FRAME_YEARS = [1, 3, 5, 10, 20, 50] as const;

/** Selectable chart time frames; those longer than the history are unavailable. */
export function timeFrames(dataset: Pick<Dataset, "returns">): TimeFrame[] {
  const n = dataset.returns.length;
  return [
    ...TIME_FRAME_YEARS.map((y) => ({ label: `${y}Y`, months: y * 12, available: y * 12 <= n })),
    { label: "Max", months: n, available: true },
  ];
}

export type ChartPoint = { month: string; index: number; sma: number };

/** The last `months` of the index rebased to 100, with its `smaWindow`-month SMA. */
export function chartSeries(dataset: Dataset, months: number, smaWindow: number): ChartPoint[] {
  const levels = indexLevels(dataset);
  const n = levels.length;
  const first = Math.max(0, n - months);
  // Rebase so the first point is 100.
  const scale = 100 / (levels[first] ?? 1);
  const points: ChartPoint[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += levels[i] ?? 0;
    if (i >= smaWindow) sum -= levels[i - smaWindow] ?? 0;
    if (i < first) continue;
    const count = Math.min(i + 1, smaWindow);
    points.push({
      month: monthLabel(dataset, i),
      index: (levels[i] ?? 0) * scale,
      sma: (sum / count) * scale,
    });
  }
  return points;
}

export type PeriodStats = {
  from: string;
  to: string;
  months: number;
  totalReturn: number;
  cagr: number;
  /** Annualised standard deviation of monthly returns. */
  volatility: number;
  /** Largest drop from a high within the period (≤ 0). */
  maxDrawdown: number;
};

/** Statistics of the last `months` of the history (or all of it). */
export function periodStats(dataset: Dataset, months: number): PeriodStats {
  const n = dataset.returns.length;
  const first = Math.max(0, n - months);
  const returns = dataset.returns.slice(first);
  const m = returns.length;
  let level = 1;
  let high = 1;
  let maxDrawdown = 0;
  for (const r of returns) {
    level *= 1 + r;
    high = Math.max(high, level);
    maxDrawdown = Math.min(maxDrawdown, level / high - 1);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / m;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / m;
  return {
    from: monthLabel(dataset, first),
    to: monthLabel(dataset, n - 1),
    months: m,
    totalReturn: level - 1,
    cagr: level ** (12 / m) - 1,
    volatility: Math.sqrt(variance * 12),
    maxDrawdown,
  };
}

export type BearMarket = {
  peak: string;
  trough: string;
  /** Month the all-time high was regained, null while ongoing. */
  recovered: string | null;
  peakIndex: number;
  troughIndex: number;
  recoveredIndex: number | null;
  /** Peak-to-trough decline (≤ −20 %). */
  decline: number;
  monthsDown: number;
  /** Months from the peak until the all-time high was regained, null while ongoing. */
  monthsToRecover: number | null;
};

/** Declines of 20 % or more from an all-time high, from that high to the lowest point before it was regained. */
export function bearMarkets(dataset: Dataset): BearMarket[] {
  const levels = indexLevels(dataset);
  const bears: BearMarket[] = [];
  const at = (i: number) => levels[i] ?? 0;
  const record = (peak: number, trough: number, recovered: number | null) => {
    const decline = at(trough) / at(peak) - 1;
    if (decline > BEAR_THRESHOLD) return;
    bears.push({
      peak: monthLabel(dataset, peak),
      trough: monthLabel(dataset, trough),
      recovered: recovered === null ? null : monthLabel(dataset, recovered),
      peakIndex: peak,
      troughIndex: trough,
      recoveredIndex: recovered,
      decline,
      monthsDown: trough - peak,
      monthsToRecover: recovered === null ? null : recovered - peak,
    });
  };
  let peak = 0;
  let trough = 0;
  for (let i = 1; i < levels.length; i++) {
    if (at(i) >= at(peak)) {
      if (trough !== peak) record(peak, trough, i);
      peak = i;
      trough = i;
    } else if (at(i) < at(trough)) {
      trough = i;
    }
  }
  if (trough !== peak) record(peak, trough, null);
  return bears;
}

export type BullMarket = {
  start: string;
  /** Peak before the next bear market, null for the current bull market. */
  end: string | null;
  gain: number;
  months: number;
};

/** Bull markets between bear markets: from a trough to the next bear market's peak. */
export function bullMarkets(dataset: Dataset): { past: BullMarket[]; current: BullMarket | null } {
  const levels = indexLevels(dataset);
  const at = (i: number) => levels[i] ?? 0;
  const bears = bearMarkets(dataset);
  const past = bears.slice(1).map((next, k) => {
    const start = bears[k]?.troughIndex ?? 0;
    return {
      start: monthLabel(dataset, start),
      end: next.peak,
      gain: at(next.peakIndex) / at(start) - 1,
      months: next.peakIndex - start,
    };
  });
  const last = bears.at(-1);
  const now = levels.length - 1;
  const current =
    last && last.recovered !== null
      ? {
          start: last.trough,
          end: null,
          gain: at(now) / at(last.troughIndex) - 1,
          months: now - last.troughIndex,
        }
      : null;
  return { past, current };
}

export type Indicators = {
  /** Annualised trailing returns; null if the history is shorter. */
  trailing: { years: number; cagr: number | null }[];
  volatility12m: number;
  volatilityLongTerm: number;
  /** Latest annual short rate (SOFR proxy). */
  shortRate: number;
};

export function indicators(dataset: Dataset): Indicators {
  const n = dataset.returns.length;
  return {
    trailing: [1, 3, 5, 10].map((years) => ({
      years,
      cagr: years * 12 <= n ? periodStats(dataset, years * 12).cagr : null,
    })),
    volatility12m: periodStats(dataset, 12).volatility,
    volatilityLongTerm: datasetStats(dataset).volatility,
    shortRate: dataset.rates.at(-1) ?? 0,
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}
