import { defaultScenario, type ScenarioParams } from "@/simulation/params";

/** Categorical palette, fixed order (validated reference palette, light mode). */
export const SCENARIO_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
] as const;
export const MAX_SCENARIOS = SCENARIO_COLORS.length;

export type Scenario = { key: string; colorIndex: number; params: ScenarioParams };

export const scenarioColor = (s: Scenario) => SCENARIO_COLORS[s.colorIndex];

let counter = 0;
export const newKey = () => `s${++counter}`;

/** Next free color slot, so colors follow the scenario and never get repainted. */
export function nextColorIndex(scenarios: Scenario[]): number {
  const used = new Set(scenarios.map((s) => s.colorIndex));
  for (let i = 0; i < MAX_SCENARIOS; i++) if (!used.has(i)) return i;
  return 0;
}

export function initialScenarios(): Scenario[] {
  return [
    { key: newKey(), colorIndex: 0, params: { ...defaultScenario, name: "1× buy and hold" } },
    {
      key: newKey(),
      colorIndex: 1,
      params: { ...defaultScenario, name: "2× buy and hold", leveragedShare: 1, leverage: 2 },
    },
    {
      key: newKey(),
      colorIndex: 2,
      params: {
        ...defaultScenario,
        name: "2× with 10-month SMA",
        leveragedShare: 1,
        leverage: 2,
        strategy: "sma",
      },
    },
  ];
}
