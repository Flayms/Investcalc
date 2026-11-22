import type { Dataset } from "@/simulation/dataset";
import type { GlobalSettings, ScenarioParams } from "@/simulation/params";
import {
  exploreLeverage,
  type FactorImpact,
  factorImpact,
  type LeverageSweep,
  runScenario,
  type ScenarioResult,
} from "@/simulation/simulate";

export type RunJob = { key: string; dataset: Dataset; scenario: ScenarioParams };

export type WorkerRequest =
  | { id: number; type: "run"; jobs: RunJob[]; global: GlobalSettings }
  | {
      id: number;
      type: "analyze";
      dataset: Dataset;
      scenario: ScenarioParams;
      global: GlobalSettings;
    };

export type Analysis = { sweep: LeverageSweep; factors: FactorImpact };

export type WorkerResponse =
  | { id: number; type: "run"; results: Record<string, ScenarioResult> }
  | { id: number; type: "analyze"; analysis: Analysis }
  | { id: number; type: "error"; message: string };

/** Paths used for the (more expensive) per-scenario analyses. */
export const ANALYSIS_MAX_PATHS = 1000;

export function handleRequest(req: WorkerRequest): WorkerResponse {
  try {
    if (req.type === "run") {
      const results: Record<string, ScenarioResult> = {};
      for (const job of req.jobs)
        results[job.key] = runScenario(job.dataset, job.scenario, req.global);
      return { id: req.id, type: "run", results };
    }
    const global = { ...req.global, paths: Math.min(req.global.paths, ANALYSIS_MAX_PATHS) };
    return {
      id: req.id,
      type: "analyze",
      analysis: {
        sweep: exploreLeverage(req.dataset, req.scenario, global),
        factors: factorImpact(req.dataset, req.scenario, global),
      },
    };
  } catch (e) {
    return { id: req.id, type: "error", message: String(e) };
  }
}
