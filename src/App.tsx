import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataBasisCard } from "@/features/data/DataBasisCard";
import { type DatasetLoader, fetchDataset, useDatasets } from "@/features/data/useDatasets";
import { MarketStatusCard } from "@/features/market/MarketStatusCard";
import { FactorImpactCard, LeverageExplorer } from "@/features/results/AnalysisCards";
import { FanChart } from "@/features/results/FanChart";
import { ResultsTable } from "@/features/results/ResultsTable";
import { GlobalSettingsCard } from "@/features/scenarios/GlobalSettingsCard";
import { ScenarioBar } from "@/features/scenarios/ScenarioBar";
import { ScenarioEditor } from "@/features/scenarios/ScenarioEditor";
import {
  initialScenarios,
  newKey,
  nextColorIndex,
  type Scenario,
} from "@/features/scenarios/scenario";
import type { SimulationClient } from "@/features/simulation/client";
import { useSimulation } from "@/features/simulation/useSimulation";
import { defaultGlobal, defaultScenario, type ScenarioParams } from "@/simulation/params";

type AppProps = {
  loadDataset?: DatasetLoader;
  /** Injected in tests; defaults to a Web Worker client. */
  simulationClient?: Pick<SimulationClient, "run" | "analyze">;
};

export function App({ loadDataset = fetchDataset, simulationClient }: AppProps) {
  const datasets = useDatasets(loadDataset);
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);
  const [selectedKey, setSelectedKey] = useState(scenarios[0]?.key ?? "");
  const [global, setGlobal] = useState(defaultGlobal);
  const selected = scenarios.find((s) => s.key === selectedKey) ?? (scenarios[0] as Scenario);
  const { results, running, analysis, analysing } = useSimulation(
    datasets.data,
    scenarios,
    selected,
    global,
    simulationClient,
  );

  const addScenario = (params: ScenarioParams) => {
    const scenario = { key: newKey(), colorIndex: nextColorIndex(scenarios), params };
    setScenarios([...scenarios, scenario]);
    setSelectedKey(scenario.key);
  };
  const updateSelected = (params: ScenarioParams) =>
    setScenarios(scenarios.map((s) => (s.key === selected.key ? { ...s, params } : s)));
  const removeSelected = () => {
    const rest = scenarios.filter((s) => s.key !== selected.key);
    setScenarios(rest);
    if (rest[0]) setSelectedKey(rest[0].key);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Investcalc</h1>
              <p className="text-xs text-muted-foreground">
                Monte Carlo simulation of ETF savings plans on historical data — leverage, costs and
                German taxes.
              </p>
            </div>
            {running && (
              <span
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
                role="status"
              >
                <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> Simulating…
              </span>
            )}
          </div>
        </header>

        {datasets.isError ? (
          <p className="p-6 text-sm text-red-800">
            Could not load the historical data: {String(datasets.error)}
          </p>
        ) : !datasets.data ? (
          <p className="p-6 text-sm text-muted-foreground">Loading historical data…</p>
        ) : (
          <main className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <GlobalSettingsCard global={global} onChange={setGlobal} />
              <ScenarioEditor
                scenario={selected}
                datasets={datasets.data}
                onChange={updateSelected}
              />
            </aside>
            <div className="min-w-0 space-y-6">
              <MarketStatusCard datasets={datasets.data} />
              <ScenarioBar
                scenarios={scenarios}
                selectedKey={selected.key}
                onSelect={setSelectedKey}
                onAdd={() =>
                  addScenario({ ...defaultScenario, name: `Scenario ${scenarios.length + 1}` })
                }
                onDuplicate={() =>
                  addScenario({ ...selected.params, name: `${selected.params.name} (copy)` })
                }
                onRemove={removeSelected}
              />
              <FanChart scenarios={scenarios} results={results} selectedKey={selected.key} />
              <ResultsTable
                scenarios={scenarios}
                results={results}
                horizonYears={global.horizonYears}
              />
              <div className="grid gap-6 xl:grid-cols-2">
                <LeverageExplorer scenario={selected} analysis={analysis} loading={analysing} />
                <FactorImpactCard scenario={selected} analysis={analysis} loading={analysing} />
              </div>
              <DataBasisCard datasets={datasets.data} />
            </div>
          </main>
        )}
      </div>
    </TooltipProvider>
  );
}
