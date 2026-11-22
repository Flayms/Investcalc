import { defaultScenario, type ScenarioParams, scenarioSchema } from "@/simulation/params";

/**
 * Categorical palette, fixed order (validated reference palette). The hex values are the light
 * steps; the rendered colors are CSS variables so the dark theme can use its own validated steps
 * (see `--series-N` in index.css).
 */
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

/**
 * Settings that are facts about the data, the products, the broker or tax law rather than choices,
 * so they are the same for every scenario (REQ-002-02).
 */
export const SHARED_KEYS = [
  "fromYear",
  "toYear",
  "terUnleveraged",
  "terLeveraged",
  "includeSofr",
  "financingSpread",
  "orderFee",
  "bidAskSpread",
  "taxesEnabled",
  "taxRate",
  "partialExemption",
  "allowance",
  "baseRate",
] as const satisfies readonly (keyof ScenarioParams)[];

type SharedKey = (typeof SHARED_KEYS)[number];
const sharedMask = Object.fromEntries(SHARED_KEYS.map((k) => [k, true])) as Record<SharedKey, true>;

export const sharedSchema = scenarioSchema.pick(sharedMask);
export const choicesSchema = scenarioSchema.omit(sharedMask);

/** Shared by all scenarios. */
export type SharedSettings = Pick<ScenarioParams, SharedKey>;
/** What the user chooses per scenario. */
export type ScenarioChoices = Omit<ScenarioParams, SharedKey>;

export const defaultShared: SharedSettings = sharedSchema.parse(defaultScenario);
export const defaultChoices: ScenarioChoices = choicesSchema.parse(defaultScenario);

export const toParams = (choices: ScenarioChoices, shared: SharedSettings): ScenarioParams => ({
  ...choices,
  ...shared,
});

export type Scenario<P = ScenarioChoices> = {
  key: string;
  colorIndex: number;
  params: P;
  /** Hidden scenarios are kept but neither simulated nor shown in the results (REQ-004-01). */
  hidden?: boolean;
};
/** A scenario merged with the shared settings, ready to simulate. */
export type ResolvedScenario = Scenario<ScenarioParams>;

export const scenarioColor = (s: Pick<Scenario, "colorIndex">) =>
  `var(--series-${(s.colorIndex % SCENARIO_COLORS.length) + 1})`;

/** A key that is not used by any of the given scenarios. */
export function newKey(existing: Pick<Scenario, "key">[] = []): string {
  const used = new Set(existing.map((s) => s.key));
  let i = existing.length + 1;
  while (used.has(`s${i}`)) i++;
  return `s${i}`;
}

/** Next free color slot, so colors follow the scenario and never get repainted. */
export function nextColorIndex(scenarios: Scenario[]): number {
  const used = new Set(scenarios.map((s) => s.colorIndex));
  for (let i = 0; i < MAX_SCENARIOS; i++) if (!used.has(i)) return i;
  return 0;
}

export function initialScenarios(): Scenario[] {
  return [
    { key: "s1", colorIndex: 0, params: { ...defaultChoices, name: "1× buy and hold" } },
    {
      key: "s2",
      colorIndex: 1,
      params: { ...defaultChoices, name: "2× buy and hold", leveragedShare: 1, leverage: 2 },
    },
    {
      key: "s3",
      colorIndex: 2,
      params: {
        ...defaultChoices,
        name: "2× with 10-month SMA",
        leveragedShare: 1,
        leverage: 2,
        strategy: "sma",
      },
    },
  ];
}
