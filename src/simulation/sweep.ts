import type { Dataset } from "@/simulation/dataset";
import { type GlobalSettings, type ScenarioParams, WARMUP_MONTHS } from "@/simulation/params";
import { simulatePath } from "@/simulation/portfolio";
import { buildPaths, lossShare, pathOptions } from "@/simulation/simulate";
import { median, percentile } from "@/simulation/stats";

/** Sliders the value explorer can sweep (REQ-008-01). */
export type SweepParam = "leveragedShare" | "leverage" | "smaMonths";
export const SWEEP_PARAMS: SweepParam[] = ["leveragedShare", "leverage", "smaMonths"];

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) =>
    Number((from + i * step).toFixed(4)),
  );

/** Values simulated per slider; they span the slider's full range. */
export const SWEEP_VALUES: Record<SweepParam, number[]> = {
  leveragedShare: range(0, 1, 0.1),
  leverage: range(1, 3, 0.25),
  smaMonths: range(2, 12, 1),
};

/** Paths used for each sweep; all values share the same paths. */
export const SWEEP_MAX_PATHS = 500;

export type SweepPoint = {
  value: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  /** Share of paths ending below the amount paid in. */
  lossProbability: number;
};

export type ParameterSweep = {
  param: SweepParam;
  points: SweepPoint[];
  invested: number;
  /** Settings changed so that the slider has an effect (REQ-008-02). */
  assumed: Partial<ScenarioParams>;
  /** A point to compare against, e.g. buy and hold for the SMA window. */
  reference?: { label: string; point: SweepPoint };
  error?: string;
};

/** The smallest change that makes `param` matter for the scenario (REQ-008-02). */
function assumptionsFor(param: SweepParam, s: ScenarioParams): Partial<ScenarioParams> {
  if (param === "leverage" && s.leveragedShare === 0) return { leveragedShare: 1 };
  if (param === "leveragedShare" && s.leverage === 1) return { leverage: 2 };
  if (param === "smaMonths" && s.strategy !== "sma") return { strategy: "sma" };
  return {};
}

/** Simulates the scenario for every value of one slider on the same paths (REQ-008-01). */
export function sweepParameter(
  dataset: Dataset,
  s: ScenarioParams,
  g: GlobalSettings,
  param: SweepParam,
): ParameterSweep {
  const assumed = assumptionsFor(param, s);
  const global = { ...g, paths: Math.min(g.paths, SWEEP_MAX_PATHS) };
  const { paths, error } = buildPaths(dataset, s, global);
  if (error || paths.length === 0)
    return { param, points: [], invested: 0, assumed, error: error ?? "No paths." };
  const options = pathOptions(dataset);
  let invested = 0;
  const simulate = (params: ScenarioParams, value: number): SweepPoint => {
    const results = paths.map((path) => simulatePath(path, WARMUP_MONTHS, params, options));
    invested = median(results.map((r) => r.invested));
    const finals = Float64Array.from(results, (r) => r.finalAfterTax).sort();
    const at = (p: number) => percentile(finals, p);
    return {
      value,
      p5: at(0.05),
      p10: at(0.1),
      p25: at(0.25),
      p50: at(0.5),
      p75: at(0.75),
      p90: at(0.9),
      p95: at(0.95),
      lossProbability: lossShare(results),
    };
  };
  const base = { ...s, ...assumed };
  const points = SWEEP_VALUES[param].map((value) => simulate({ ...base, [param]: value }, value));
  const reference =
    param === "smaMonths"
      ? { label: "Buy and hold", point: simulate({ ...base, strategy: "buyAndHold" }, 0) }
      : undefined;
  return { param, points, invested, assumed, reference };
}

/** What "best" means (REQ-008-03). */
export type Goal = "median" | "badCase" | "loss";

const score: Record<Goal, (p: SweepPoint) => number> = {
  median: (p) => p.p50,
  badCase: (p) => p.p10,
  loss: (p) => -p.lossProbability,
};

/** The point that is best for `goal`; ties go to the higher median. */
export function bestPoint(points: SweepPoint[], goal: Goal): SweepPoint | undefined {
  const f = score[goal];
  return points.reduce<SweepPoint | undefined>((best, p) => {
    if (!best) return p;
    const d = f(p) - f(best);
    if (d > 1e-12 || (Math.abs(d) <= 1e-12 && p.p50 > best.p50)) return p;
    return best;
  }, undefined);
}
