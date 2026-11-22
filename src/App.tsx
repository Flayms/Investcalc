import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataBasisCard } from "@/features/data/DataBasisCard";
import { type DatasetLoader, fetchDataset, useDatasets } from "@/features/data/useDatasets";
import { MarketStatusCard } from "@/features/market/MarketStatusCard";
import {
  browserStorage,
  loadState,
  type PersistedState,
  saveState,
} from "@/features/persistence/persistence";
import { FactorImpactCard, LeverageExplorer } from "@/features/results/AnalysisCards";
import { FanChart } from "@/features/results/FanChart";
import { ResultsTable } from "@/features/results/ResultsTable";
import { GlobalSettingsCard } from "@/features/scenarios/GlobalSettingsCard";
import { HistoricalPeriodField } from "@/features/scenarios/HistoricalPeriodField";
import { ScenarioBar } from "@/features/scenarios/ScenarioBar";
import { ScenarioEditor } from "@/features/scenarios/ScenarioEditor";
import { SharedSettingsCard } from "@/features/scenarios/SharedSettingsCard";
import {
  defaultChoices,
  defaultShared,
  initialScenarios,
  newKey,
  nextColorIndex,
  type ResolvedScenario,
  type Scenario,
  type ScenarioChoices,
  toParams,
} from "@/features/scenarios/scenario";
import type { SimulationClient } from "@/features/simulation/client";
import { useSimulation } from "@/features/simulation/useSimulation";
import { defaultGlobal } from "@/simulation/params";

type AppProps = {
  loadDataset?: DatasetLoader;
  /** Injected in tests; defaults to a Web Worker client. */
  simulationClient?: Pick<SimulationClient, "run" | "analyze">;
};

function initialState(): PersistedState {
  const restored = loadState(browserStorage());
  if (restored) return restored;
  const scenarios = initialScenarios();
  return {
    scenarios,
    selectedKey: scenarios[0]?.key ?? "",
    global: defaultGlobal,
    shared: defaultShared,
  };
}

export function App({ loadDataset = fetchDataset, simulationClient }: AppProps) {
  const datasets = useDatasets(loadDataset);
  const [initial] = useState(initialState);
  const [scenarios, setScenarios] = useState<Scenario[]>(initial.scenarios);
  const [selectedKey, setSelectedKey] = useState(initial.selectedKey);
  const [global, setGlobal] = useState(initial.global);
  const [shared, setShared] = useState(initial.shared);
  const selected = scenarios.find((s) => s.key === selectedKey) ?? (scenarios[0] as Scenario);

  useEffect(() => {
    saveState(browserStorage(), { scenarios, selectedKey: selected.key, global, shared });
  }, [scenarios, selected.key, global, shared]);

  const resolved = useMemo<ResolvedScenario[]>(
    () => scenarios.map((s) => ({ ...s, params: toParams(s.params, shared) })),
    [scenarios, shared],
  );
  // Memoised on its own so editing another scenario does not re-run the analysis.
  const resolvedSelected = useMemo<ResolvedScenario>(
    () => ({ ...selected, params: toParams(selected.params, shared) }),
    [selected, shared],
  );
  const { results, running, analysis, analysing } = useSimulation(
    datasets.data,
    resolved,
    resolvedSelected,
    global,
    simulationClient,
  );

  const addScenario = (params: ScenarioChoices) => {
    const scenario = { key: newKey(scenarios), colorIndex: nextColorIndex(scenarios), params };
    setScenarios([...scenarios, scenario]);
    setSelectedKey(scenario.key);
  };
  const updateSelected = (params: ScenarioChoices) =>
    setScenarios(scenarios.map((s) => (s.key === selected.key ? { ...s, params } : s)));
  const removeSelected = () => {
    const rest = scenarios.filter((s) => s.key !== selected.key);
    setScenarios(rest);
    if (rest[0]) setSelectedKey(rest[0].key);
  };
  const anyLeveraged = scenarios.some((s) => s.params.leveragedShare > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <Tabs defaultValue="simulation" className="min-h-screen gap-0 bg-muted/40">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Investcalc</h1>
              <p className="text-xs text-muted-foreground">
                Monte Carlo simulation of ETF savings plans on historical data — leverage, costs and
                German taxes.
              </p>
            </div>
            <TabsList aria-label="Views">
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="market">Market & data</TabsTrigger>
            </TabsList>
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
          <>
            <TabsContent value="simulation">
              <main className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="space-y-6">
                  <GlobalSettingsCard global={global} onChange={setGlobal}>
                    <HistoricalPeriodField
                      datasets={datasets.data}
                      value={shared}
                      onChange={(period) => setShared({ ...shared, ...period })}
                    />
                  </GlobalSettingsCard>
                  <ScenarioEditor
                    scenario={selected}
                    datasets={datasets.data}
                    onChange={updateSelected}
                  />
                  <SharedSettingsCard
                    shared={shared}
                    context={{ anyLeveraged }}
                    onChange={setShared}
                  />
                </aside>
                <div className="min-w-0 space-y-6">
                  <ScenarioBar
                    scenarios={scenarios}
                    selectedKey={selected.key}
                    onSelect={setSelectedKey}
                    onAdd={() =>
                      addScenario({ ...defaultChoices, name: `Scenario ${scenarios.length + 1}` })
                    }
                    onDuplicate={() =>
                      addScenario({ ...selected.params, name: `${selected.params.name} (copy)` })
                    }
                    onRemove={removeSelected}
                  />
                  <FanChart scenarios={resolved} results={results} selectedKey={selected.key} />
                  <ResultsTable
                    scenarios={resolved}
                    results={results}
                    horizonYears={global.horizonYears}
                  />
                  <div className="grid gap-6 xl:grid-cols-2">
                    <LeverageExplorer
                      scenario={resolvedSelected}
                      analysis={analysis}
                      loading={analysing}
                      invested={results[selected.key]?.invested}
                    />
                    <FactorImpactCard
                      scenario={resolvedSelected}
                      analysis={analysis}
                      loading={analysing}
                    />
                  </div>
                </div>
              </main>
            </TabsContent>
            <TabsContent value="market">
              <main className="mx-auto max-w-[1500px] space-y-6 px-6 py-6">
                <MarketStatusCard datasets={datasets.data} />
                <DataBasisCard datasets={datasets.data} />
              </main>
            </TabsContent>
          </>
        )}
      </Tabs>
    </TooltipProvider>
  );
}
