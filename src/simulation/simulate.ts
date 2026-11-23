import { type Dataset, monthDays, monthLabel } from "@/simulation/dataset";
import { type GlobalSettings, type ScenarioParams, WARMUP_MONTHS } from "@/simulation/params";
import { type PathMonth, type PathResult, simulatePath } from "@/simulation/portfolio";
import { createRng } from "@/simulation/rng";
import { blockBootstrapPath, rollingWindowPaths } from "@/simulation/sampling";
import { median, percentile } from "@/simulation/stats";

export type Band = {
  month: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  /** Average own money paid in by this month (inflation-adjusted when the results are). */
  paid: number;
};

export type FinalPercentiles = {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
};

/** Why a simulation has no result; the UI words it (REQ-014-01). */
export type SimulationError =
  | { kind: "periodShorterThanHorizon"; years: number }
  | { kind: "periodShorterThanTwoYears"; years: number }
  | { kind: "noPaths" };

export type ScenarioResult = {
  error?: SimulationError;
  pathCount: number;
  period: { from: string; to: string };
  bands: Band[];
  final: FinalPercentiles;
  /** Final value after taxes at P1, P2, …, P99 (index i = percentile i + 1). */
  distribution: number[];
  invested: number;
  probabilityOfLoss: number;
  medianFees: number;
  medianTaxes: number;
};

/**
 * Share of paths ending below their own money paid in. Inflation-adjusted, each path has its own
 * real amount paid in (REQ-013-03).
 */
export const lossShare = (results: PathResult[]) =>
  results.filter((r) => r.finalAfterTax < r.invested).length / results.length;

export const pathOptions = (dataset: Dataset) => ({
  signalLagMonths: dataset.priceType === "average" ? 1 : 0,
});

export type PathSet = {
  paths: PathMonth[][];
  period: { from: string; to: string };
  error?: SimulationError;
};

/** Turns the selected history into the list of paths (warm-up + horizon months each). */
export function buildPaths(dataset: Dataset, s: ScenarioParams, g: GlobalSettings): PathSet {
  const startYear = Number(dataset.start.slice(0, 4));
  const startMonth = Number(dataset.start.slice(5, 7)) - 1;
  const from = Math.max(0, (s.fromYear - startYear) * 12 - startMonth);
  const to = Math.min(dataset.returns.length, (s.toYear + 1 - startYear) * 12 - startMonth);
  const period = {
    from: monthLabel(dataset, from),
    to: monthLabel(dataset, Math.max(from, to - 1)),
  };

  const history: PathMonth[] = [];
  const days = monthDays(dataset);
  for (let i = from; i < to; i++) {
    history.push({
      r: dataset.returns[i] ?? 0,
      rate: dataset.rates[i] ?? 0,
      variance: dataset.variance[i] ?? 0,
      fx: dataset.fx?.[i] ?? 0,
      cashRate: dataset.cashRates?.[i] ?? dataset.rates[i] ?? 0,
      inflation: dataset.inflation[i] ?? 0,
      days: days[i],
    });
  }
  const pick = (indices: number[]) => indices.map((i) => history[i] as PathMonth);

  const pathLength = g.horizonYears * 12 + WARMUP_MONTHS;
  const years = Math.round((history.length / 12) * 10) / 10;
  if (g.sampling === "rolling") {
    const windows = rollingWindowPaths(history.length, pathLength);
    if (windows.length === 0) {
      return {
        paths: [],
        period,
        error: { kind: "periodShorterThanHorizon", years },
      };
    }
    return { paths: windows.map(pick), period };
  }
  if (history.length < 2 * WARMUP_MONTHS) {
    return {
      paths: [],
      period,
      error: { kind: "periodShorterThanTwoYears", years },
    };
  }
  const rng = createRng(g.seed);
  const paths = Array.from({ length: g.paths }, () =>
    pick(blockBootstrapPath(history.length, pathLength, g.blockMonths, rng)),
  );
  return { paths, period };
}

const sortedCopy = (values: ArrayLike<number>) => Float64Array.from(values).sort();

function finalPercentiles(values: number[]): FinalPercentiles {
  const s = sortedCopy(values);
  return {
    p5: percentile(s, 0.05),
    p10: percentile(s, 0.1),
    p25: percentile(s, 0.25),
    p50: percentile(s, 0.5),
    p75: percentile(s, 0.75),
    p90: percentile(s, 0.9),
    p95: percentile(s, 0.95),
  };
}

/** Percentiles shown in the distribution chart: P1 … P99. */
export const DISTRIBUTION_PERCENTILES = Array.from({ length: 99 }, (_, i) => i + 1);

const emptyFinal: FinalPercentiles = { p5: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 };

export function runScenario(
  dataset: Dataset,
  s: ScenarioParams,
  g: GlobalSettings,
): ScenarioResult {
  const { paths, period, error } = buildPaths(dataset, s, g);
  if (error || paths.length === 0) {
    return {
      error: error ?? { kind: "noPaths" },
      pathCount: 0,
      period,
      bands: [],
      final: emptyFinal,
      distribution: [],
      invested: 0,
      probabilityOfLoss: 0,
      medianFees: 0,
      medianTaxes: 0,
    };
  }
  const options = pathOptions(dataset);
  const results: PathResult[] = paths.map((path) => simulatePath(path, WARMUP_MONTHS, s, options));
  if (results.length === 0) throw new Error("no paths");
  const horizon = g.horizonYears * 12;
  const column = new Float64Array(results.length);
  // Paid in only differs between paths when it is inflation-adjusted; then the average is shown.
  const firstPaid = results[0]?.paidIn;
  const bands: Band[] = [];
  for (let m = 0; m <= horizon; m++) {
    for (let i = 0; i < results.length; i++) column[i] = results[i]?.netWorth[m] ?? 0;
    column.sort();
    let paid = firstPaid?.[m] ?? 0;
    if (s.inflationAdjusted) {
      paid = 0;
      for (const r of results) paid += r.paidIn[m] ?? 0;
      paid /= results.length;
    }
    bands.push({
      month: m,
      paid,
      p10: percentile(column, 0.1),
      p25: percentile(column, 0.25),
      p50: percentile(column, 0.5),
      p75: percentile(column, 0.75),
      p90: percentile(column, 0.9),
    });
  }
  const finals = results.map((r) => r.finalAfterTax);
  const invested = median(results.map((r) => r.invested));
  const sortedFinals = sortedCopy(finals);
  return {
    pathCount: results.length,
    period,
    bands,
    final: finalPercentiles(finals),
    distribution: DISTRIBUTION_PERCENTILES.map((p) => percentile(sortedFinals, p / 100)),
    invested,
    probabilityOfLoss: lossShare(results),
    medianFees: median(results.map((r) => r.fees)),
    medianTaxes: median(results.map((r) => r.taxes)),
  };
}

export type FactorId = "ter" | "sofr" | "spread" | "trading" | "taxes";
export type Factor = { id: FactorId; cost: number };
export type FactorImpact = { baseline: number; factors: Factor[]; error?: SimulationError };

const FACTORS: {
  id: FactorId;
  leveragedOnly?: boolean;
  remove: (s: ScenarioParams) => ScenarioParams;
}[] = [
  { id: "ter", remove: (s) => ({ ...s, terUnleveraged: 0, terLeveraged: 0 }) },
  {
    id: "sofr",
    leveragedOnly: true,
    remove: (s) => ({ ...s, includeSofr: false }),
  },
  {
    id: "spread",
    leveragedOnly: true,
    remove: (s) => ({ ...s, financingSpread: 0 }),
  },
  {
    id: "trading",
    remove: (s) => ({ ...s, orderFee: 0, bidAskSpread: 0 }),
  },
  { id: "taxes", remove: (s) => ({ ...s, taxesEnabled: false }) },
];

/** How much higher the median final value would be without each cost factor (same paths). */
export function factorImpact(dataset: Dataset, s: ScenarioParams, g: GlobalSettings): FactorImpact {
  const { paths, error } = buildPaths(dataset, s, g);
  if (error) return { baseline: 0, factors: [], error };
  const options = pathOptions(dataset);
  const medianFinal = (params: ScenarioParams) =>
    median(paths.map((path) => simulatePath(path, WARMUP_MONTHS, params, options).finalAfterTax));
  const baseline = medianFinal(s);
  const leveraged = s.leveragedShare > 0 && s.leverage > 1;
  const factors = FACTORS.filter((f) => leveraged || !f.leveragedOnly).map((f) => ({
    id: f.id,
    cost: medianFinal(f.remove(s)) - baseline,
  }));
  return { baseline, factors };
}
