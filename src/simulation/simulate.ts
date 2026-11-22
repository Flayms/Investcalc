import { type Dataset, monthLabel } from "@/simulation/dataset";
import { trailingVariance } from "@/simulation/leverage";
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

export type ScenarioResult = {
  error?: string;
  pathCount: number;
  period: { from: string; to: string };
  bands: Band[];
  final: FinalPercentiles;
  invested: number;
  probabilityOfLoss: number;
  medianFees: number;
  medianTaxes: number;
};

const pathOptions = (dataset: Dataset) => ({
  signalLagMonths: dataset.priceType === "average" ? 1 : 0,
});

type PathSet = { paths: PathMonth[][]; period: { from: string; to: string }; error?: string };

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

  const variance = trailingVariance(dataset.returns);
  const history: PathMonth[] = [];
  for (let i = from; i < to; i++) {
    history.push({
      r: dataset.returns[i] ?? 0,
      rate: dataset.rates[i] ?? 0,
      variance: variance[i] ?? 0,
    });
  }
  const pick = (indices: number[]) => indices.map((i) => history[i] as PathMonth);

  const pathLength = g.horizonYears * 12 + WARMUP_MONTHS;
  const years = (history.length / 12).toFixed(1);
  if (g.sampling === "rolling") {
    const windows = rollingWindowPaths(history.length, pathLength);
    if (windows.length === 0) {
      return {
        paths: [],
        period,
        error: `The selected period (${years} years) is shorter than the horizon plus one warm-up year. Use random slicing or a shorter horizon.`,
      };
    }
    return { paths: windows.map(pick), period };
  }
  if (history.length < 2 * WARMUP_MONTHS) {
    return {
      paths: [],
      period,
      error: `The selected period (${years} years) is shorter than 2 years.`,
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

const emptyFinal: FinalPercentiles = { p5: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 };

export function runScenario(
  dataset: Dataset,
  s: ScenarioParams,
  g: GlobalSettings,
): ScenarioResult {
  const { paths, period, error } = buildPaths(dataset, s, g);
  if (error || paths.length === 0) {
    return {
      error: error ?? "No paths.",
      pathCount: 0,
      period,
      bands: [],
      final: emptyFinal,
      invested: 0,
      probabilityOfLoss: 0,
      medianFees: 0,
      medianTaxes: 0,
    };
  }
  const options = pathOptions(dataset);
  const results: PathResult[] = paths.map((path) => simulatePath(path, WARMUP_MONTHS, s, options));
  const first = results[0];
  if (!first) throw new Error("no paths");
  const horizon = g.horizonYears * 12;
  const column = new Float64Array(results.length);
  const bands: Band[] = [];
  for (let m = 0; m <= horizon; m++) {
    results.forEach((r, i) => {
      column[i] = r.netWorth[m] ?? 0;
    });
    const sorted = sortedCopy(column);
    bands.push({
      month: m,
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
    });
  }
  const finals = results.map((r) => r.finalAfterTax);
  const invested = first.invested;
  return {
    pathCount: results.length,
    period,
    bands,
    final: finalPercentiles(finals),
    invested,
    probabilityOfLoss: finals.filter((f) => f < invested).length / finals.length,
    medianFees: median(results.map((r) => r.fees)),
    medianTaxes: median(results.map((r) => r.taxes)),
  };
}

export type LeveragePoint = { leverage: number; p10: number; p50: number; p90: number };
export type LeverageSweep = { points: LeveragePoint[]; bestLeverage: number; error?: string };

export const LEVERAGE_STEPS = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

/** Simulates the scenario fully in a leveraged ETF for each leverage step on the same paths. */
export function exploreLeverage(
  dataset: Dataset,
  s: ScenarioParams,
  g: GlobalSettings,
): LeverageSweep {
  const { paths, error } = buildPaths(dataset, s, g);
  if (error) return { points: [], bestLeverage: 1, error };
  const options = pathOptions(dataset);
  const points = LEVERAGE_STEPS.map((leverage) => {
    const params = { ...s, leverage, leveragedShare: 1 };
    const finals = paths.map(
      (path) => simulatePath(path, WARMUP_MONTHS, params, options).finalAfterTax,
    );
    const f = finalPercentiles(finals);
    return { leverage, p10: f.p10, p50: f.p50, p90: f.p90 };
  });
  const best = points.reduce((a, b) => (b.p50 > a.p50 ? b : a));
  return { points, bestLeverage: best.leverage };
}

export type FactorId = "ter" | "sofr" | "spread" | "trading" | "taxes";
export type Factor = { id: FactorId; label: string; cost: number };
export type FactorImpact = { baseline: number; factors: Factor[]; error?: string };

const FACTORS: {
  id: FactorId;
  label: string;
  leveragedOnly?: boolean;
  remove: (s: ScenarioParams) => ScenarioParams;
}[] = [
  { id: "ter", label: "TER", remove: (s) => ({ ...s, terUnleveraged: 0, terLeveraged: 0 }) },
  {
    id: "sofr",
    label: "SOFR financing",
    leveragedOnly: true,
    remove: (s) => ({ ...s, includeSofr: false }),
  },
  {
    id: "spread",
    label: "Financing spread",
    leveragedOnly: true,
    remove: (s) => ({ ...s, financingSpread: 0 }),
  },
  {
    id: "trading",
    label: "Order fees + bid-ask",
    remove: (s) => ({ ...s, orderFee: 0, bidAskSpread: 0 }),
  },
  { id: "taxes", label: "Taxes", remove: (s) => ({ ...s, taxesEnabled: false }) },
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
    label: f.label,
    cost: medianFinal(f.remove(s)) - baseline,
  }));
  return { baseline, factors };
}
