import { useEffect, useMemo, useRef, useState } from "react";
import type { ResolvedScenario } from "@/features/scenarios/scenario";
import { isSuperseded, type SimulationApi, SimulationClient } from "@/features/simulation/client";
import { type Dataset, getDataset } from "@/simulation/dataset";
import type { GlobalSettings, ScenarioParams } from "@/simulation/params";
import type { FactorImpact, ScenarioResult } from "@/simulation/simulate";
import { type ParameterSweep, SWEEP_PARAMS, type SweepParam } from "@/simulation/sweep";

const DEBOUNCE_MS = 250;

export type Sweeps = Partial<Record<SweepParam, ParameterSweep>>;

/** What is being recalculated right now (REQ-009-01, REQ-009-02). */
export type Pending = {
  /** Keys of the scenarios being simulated. */
  run: string[];
  sweeps: Record<SweepParam, boolean>;
  factors: boolean;
};

const allSweeps = (v: boolean) =>
  Object.fromEntries(SWEEP_PARAMS.map((p) => [p, v])) as Record<SweepParam, boolean>;

/** Settings that are only shown, never simulated; changing them keeps the results (REQ-009-04). */
const DISPLAY_ONLY = ["name"] as const satisfies readonly (keyof ScenarioParams)[];

/**
 * Everything a scenario's results depend on, as a string to compare by value. Lists the fields to
 * leave out rather than the ones to keep, so a new setting can never be forgotten.
 */
export function simulationInputs(params: ScenarioParams, global: GlobalSettings): string {
  const simulated: Record<string, unknown> = { ...params };
  for (const k of DISPLAY_ONLY) delete simulated[k];
  return JSON.stringify([sorted(simulated), sorted(global)]);
}

const sorted = (o: object) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/** The latest result of a scenario and what it was computed from. */
type Kept = { inputs: string; datasets: Record<string, Dataset>; result: ScenarioResult };

/**
 * Simulates the scenarios whose inputs changed (REQ-009-04) and analyses the selected one when its
 * inputs change (REQ-009-05). Results of unchanged or hidden scenarios are kept, so showing a
 * scenario again needs no simulation (REQ-009-06); previous results stay available while new ones
 * are computed (REQ-009-02).
 */
export function useSimulation(
  datasets: Record<string, Dataset> | undefined,
  scenarios: ResolvedScenario[],
  selected: ResolvedScenario | undefined,
  global: GlobalSettings,
  injectedClient?: SimulationApi,
) {
  const client = useMemo(() => injectedClient ?? new SimulationClient(), [injectedClient]);
  const [kept, setKept] = useState<Record<string, Kept>>({});
  const [sweeps, setSweeps] = useState<Sweeps>({});
  const [factors, setFactors] = useState<FactorImpact>();
  const [analysing, setAnalysing] = useState({ sweeps: allSweeps(false), factors: false });
  const [failed, setFailed] = useState<string>();

  const inputs = useMemo(
    () => scenarios.map((s) => ({ s, inputs: simulationInputs(s.params, global) })),
    [scenarios, global],
  );
  const outdated = inputs.filter(
    ({ s, inputs }) => kept[s.key]?.inputs !== inputs || kept[s.key]?.datasets !== datasets,
  );
  /** Identifies the work to do by value, so unrelated re-renders do not restart it. */
  const work = outdated.map(({ s, inputs }) => `${s.key}\u0000${inputs}`).join("\u0001");
  const latest = useRef({ outdated, inputs, global });
  latest.current = { outdated, inputs, global };

  useEffect(() => {
    if (!datasets || !work) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const todo = latest.current.outdated;
      const jobs = todo.map(({ s }) => ({
        key: s.key,
        dataset: getDataset(datasets, s.params.etfId),
        scenario: s.params,
      }));
      client.run(jobs, latest.current.global).then(
        (r) => {
          setKept((prev) => {
            const next = { ...prev };
            for (const { s, inputs } of todo) {
              const result = r[s.key];
              // A result that arrives late still counts if nothing changed since it was requested.
              const current = latest.current.inputs.find((c) => c.s.key === s.key)?.inputs;
              if (result && (current === undefined || current === inputs))
                next[s.key] = { inputs, datasets, result };
            }
            return next;
          });
        },
        (e: unknown) => {
          if (!cancelled && !isSuperseded(e)) setFailed(work);
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, datasets, work]);

  const results = useMemo(() => {
    const shown: Record<string, ScenarioResult> = {};
    for (const s of scenarios) {
      const k = kept[s.key];
      if (k) shown[s.key] = k.result;
    }
    return shown;
  }, [scenarios, kept]);

  // Analyses depend on the selected scenario's inputs, not on its name (REQ-009-05).
  const analysisInputs = selected ? simulationInputs(selected.params, global) : undefined;
  const latestSelected = useRef({ params: selected?.params, global });
  latestSelected.current = { params: selected?.params, global };
  useEffect(() => {
    const { params, global } = latestSelected.current;
    if (!datasets || !analysisInputs || !params) return;
    let cancelled = false;
    setAnalysing({ sweeps: allSweeps(true), factors: true });
    const timer = setTimeout(() => {
      const dataset = getDataset(datasets, params.etfId);
      const failed = (done: () => void) => (e: unknown) => {
        if (!cancelled && !isSuperseded(e)) done();
      };
      for (const param of SWEEP_PARAMS) {
        const done = () => setAnalysing((p) => ({ ...p, sweeps: { ...p.sweeps, [param]: false } }));
        client.sweep(dataset, params, global, param).then((s) => {
          if (cancelled) return;
          setSweeps((prev) => ({ ...prev, [param]: s }));
          done();
        }, failed(done));
      }
      const done = () => setAnalysing((p) => ({ ...p, factors: false }));
      client.factors(dataset, params, global).then((f) => {
        if (cancelled) return;
        setFactors(f);
        done();
      }, failed(done));
    }, DEBOUNCE_MS * 2);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, datasets, analysisInputs]);

  const pending: Pending = {
    run: datasets && work !== failed ? outdated.map(({ s }) => s.key) : [],
    ...analysing,
  };
  return { results, sweeps, factors, pending };
}
