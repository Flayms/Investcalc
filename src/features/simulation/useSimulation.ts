import { useEffect, useMemo, useState } from "react";
import type { ResolvedScenario } from "@/features/scenarios/scenario";
import { isSuperseded, type SimulationApi, SimulationClient } from "@/features/simulation/client";
import { type Dataset, getDataset } from "@/simulation/dataset";
import type { GlobalSettings } from "@/simulation/params";
import type { FactorImpact, ScenarioResult } from "@/simulation/simulate";
import { type ParameterSweep, SWEEP_PARAMS, type SweepParam } from "@/simulation/sweep";

const DEBOUNCE_MS = 250;

export type Sweeps = Partial<Record<SweepParam, ParameterSweep>>;

/** What is being recalculated right now (REQ-009-01, REQ-009-02). */
export type Pending = { run: boolean; sweeps: Record<SweepParam, boolean>; factors: boolean };

const allSweeps = (v: boolean) =>
  Object.fromEntries(SWEEP_PARAMS.map((p) => [p, v])) as Record<SweepParam, boolean>;

/**
 * Re-simulates all scenarios (and analyses the selected one) whenever settings change. Previous
 * results stay available while new ones are computed (REQ-009-02).
 */
export function useSimulation(
  datasets: Record<string, Dataset> | undefined,
  scenarios: ResolvedScenario[],
  selected: ResolvedScenario | undefined,
  global: GlobalSettings,
  injectedClient?: SimulationApi,
) {
  const client = useMemo(() => injectedClient ?? new SimulationClient(), [injectedClient]);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [sweeps, setSweeps] = useState<Sweeps>({});
  const [factors, setFactors] = useState<FactorImpact>();
  const [pending, setPending] = useState<Pending>({
    run: false,
    sweeps: allSweeps(false),
    factors: false,
  });

  useEffect(() => {
    if (!datasets) return;
    let cancelled = false;
    setPending((p) => ({ ...p, run: true }));
    const timer = setTimeout(() => {
      const jobs = scenarios.map((s) => ({
        key: s.key,
        dataset: getDataset(datasets, s.params.etfId),
        scenario: s.params,
      }));
      client.run(jobs, global).then(
        (r) => {
          if (cancelled) return;
          setResults(r);
          setPending((p) => ({ ...p, run: false }));
        },
        (e: unknown) => {
          if (!cancelled && !isSuperseded(e)) setPending((p) => ({ ...p, run: false }));
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, datasets, scenarios, global]);

  const selectedParams = selected?.params;
  useEffect(() => {
    if (!datasets || !selectedParams) return;
    let cancelled = false;
    setPending((p) => ({ ...p, sweeps: allSweeps(true), factors: true }));
    const timer = setTimeout(() => {
      const dataset = getDataset(datasets, selectedParams.etfId);
      const failed = (done: () => void) => (e: unknown) => {
        if (!cancelled && !isSuperseded(e)) done();
      };
      for (const param of SWEEP_PARAMS) {
        const done = () => setPending((p) => ({ ...p, sweeps: { ...p.sweeps, [param]: false } }));
        client.sweep(dataset, selectedParams, global, param).then((s) => {
          if (cancelled) return;
          setSweeps((prev) => ({ ...prev, [param]: s }));
          done();
        }, failed(done));
      }
      const done = () => setPending((p) => ({ ...p, factors: false }));
      client.factors(dataset, selectedParams, global).then((f) => {
        if (cancelled) return;
        setFactors(f);
        done();
      }, failed(done));
    }, DEBOUNCE_MS * 2);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, datasets, selectedParams, global]);

  return { results, sweeps, factors, pending };
}
