import type { Dataset } from "@/simulation/dataset";
import type { GlobalSettings, ScenarioParams } from "@/simulation/params";
import {
  type FactorImpact,
  factorImpact,
  runScenario,
  type ScenarioResult,
} from "@/simulation/simulate";
import { type ParameterSweep, type SweepParam, sweepParameter } from "@/simulation/sweep";

export type RunJob = { key: string; dataset: Dataset; scenario: ScenarioParams };

type Analysed = { dataset: Dataset; scenario: ScenarioParams; global: GlobalSettings };

export type WorkerRequest =
  | { id: number; type: "run"; jobs: RunJob[]; global: GlobalSettings }
  | ({ id: number; type: "sweep"; param: SweepParam } & Analysed)
  | ({ id: number; type: "factors" } & Analysed);

export type WorkerResponse =
  | { id: number; type: "run"; results: Record<string, ScenarioResult> }
  | { id: number; type: "sweep"; sweep: ParameterSweep }
  | { id: number; type: "factors"; factors: FactorImpact }
  | { id: number; type: "error"; message: string };

/** Paths used for the (more expensive) cost factor analysis. */
export const ANALYSIS_MAX_PATHS = 1000;

export function handleRequest(req: WorkerRequest): WorkerResponse {
  try {
    if (req.type === "run") {
      const results: Record<string, ScenarioResult> = {};
      for (const job of req.jobs)
        results[job.key] = runScenario(job.dataset, job.scenario, req.global);
      return { id: req.id, type: "run", results };
    }
    if (req.type === "sweep") {
      return {
        id: req.id,
        type: "sweep",
        sweep: sweepParameter(req.dataset, req.scenario, req.global, req.param),
      };
    }
    const global = { ...req.global, paths: Math.min(req.global.paths, ANALYSIS_MAX_PATHS) };
    return {
      id: req.id,
      type: "factors",
      factors: factorImpact(req.dataset, req.scenario, global),
    };
  } catch (e) {
    return { id: req.id, type: "error", message: String(e) };
  }
}
