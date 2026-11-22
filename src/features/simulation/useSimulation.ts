import { useEffect, useMemo, useState } from "react";
import type { Scenario } from "@/features/scenarios/scenario";
import { SimulationClient } from "@/features/simulation/client";
import { type Dataset, getDataset } from "@/simulation/dataset";
import type { GlobalSettings } from "@/simulation/params";
import type { Analysis } from "@/simulation/protocol";
import type { ScenarioResult } from "@/simulation/simulate";

const DEBOUNCE_MS = 250;

/** Re-simulates all scenarios (and analyses the selected one) whenever settings change. */
export function useSimulation(
  datasets: Record<string, Dataset> | undefined,
  scenarios: Scenario[],
  selected: Scenario | undefined,
  global: GlobalSettings,
  injectedClient?: Pick<SimulationClient, "run" | "analyze">,
) {
  const client = useMemo(() => injectedClient ?? new SimulationClient(), [injectedClient]);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>();
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    if (!datasets) return;
    let cancelled = false;
    setRunning(true);
    const timer = setTimeout(() => {
      const jobs = scenarios.map((s) => ({
        key: s.key,
        dataset: getDataset(datasets, s.params.etfId),
        scenario: s.params,
      }));
      client.run(jobs, global).then((r) => {
        if (cancelled) return;
        setResults(r);
        setRunning(false);
      });
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
    setAnalysing(true);
    const timer = setTimeout(() => {
      client
        .analyze(getDataset(datasets, selectedParams.etfId), selectedParams, global)
        .then((a) => {
          if (cancelled) return;
          setAnalysis(a);
          setAnalysing(false);
        });
    }, DEBOUNCE_MS * 2);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, datasets, selectedParams, global]);

  return { results, running, analysis, analysing };
}
