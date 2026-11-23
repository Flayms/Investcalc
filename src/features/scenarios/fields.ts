import type { Messages } from "@/features/i18n/messages/en";
import type { ScenarioChoices, SharedSettings } from "@/features/scenarios/scenario";
import type { GlobalSettings } from "@/simulation/params";

export type Unit = "percent" | "euro" | "factor" | "months" | "years" | "count";

/** Settings with a text in the dictionary: label, help, recommendation and option labels. */
export type FieldKey = keyof Messages["fields"];

/** What the tooltip and label of a setting show, in the selected language (REQ-012-01). */
export type FieldText = {
  label: string;
  /** Tooltip: what the setting means. */
  help: string;
  /** Tooltip: the recommended value and why. */
  recommendation?: string;
  options?: Record<string, string>;
};

type Base<K> = { key: K };

export type SliderField<K> = Base<K> & {
  kind: "slider";
  min: number;
  max: number;
  step: number;
  unit: Unit;
  /** Returns false when the current value deviates from the recommendation. */
  isRecommended?: (value: number) => boolean;
};

export type SwitchField<K> = Base<K> & {
  kind: "switch";
  isRecommended?: (value: boolean) => boolean;
};

export type SelectField<K> = Base<K> & {
  kind: "select";
  /** Values; their labels are the field text's `options`. */
  options: string[];
};

export type Field<K> = SliderField<K> | SwitchField<K> | SelectField<K>;

export type ScenarioField = Field<keyof ScenarioChoices & FieldKey> & {
  /** Only shown when this returns true. */
  visible?: (s: ScenarioChoices) => boolean;
};

export type GroupId = keyof Messages["groups"];

export type FieldGroup = { id: GroupId; fields: ScenarioField[] };

export type SharedContext = {
  /** At least one scenario uses a leveraged ETF. */ anyLeveraged: boolean;
};

export type SharedField = Field<keyof SharedSettings & FieldKey> & {
  /** Only shown when this returns true. */
  visible?: (s: SharedSettings, ctx: SharedContext) => boolean;
};

export type SharedFieldGroup = { id: GroupId; fields: SharedField[] };

const near = (target: number, tolerance: number) => (v: number) =>
  Math.abs(v - target) <= tolerance;

export const scenarioGroups: FieldGroup[] = [
  {
    id: "savingsPlan",
    fields: [
      {
        key: "monthlyContribution",
        kind: "slider",
        min: 0,
        max: 5000,
        step: 25,
        unit: "euro",
      },
      {
        key: "initialInvestment",
        kind: "slider",
        min: 0,
        max: 200_000,
        step: 1000,
        unit: "euro",
      },
    ],
  },
  {
    id: "etfMix",
    fields: [
      {
        key: "leveragedShare",
        kind: "slider",
        min: 0,
        max: 1,
        step: 0.05,
        unit: "percent",
      },
      {
        key: "leverage",
        kind: "slider",
        min: 1,
        max: 3,
        step: 0.05,
        unit: "factor",
        visible: (s) => s.leveragedShare > 0,
      },
    ],
  },
  {
    id: "strategy",
    fields: [
      {
        key: "strategy",
        kind: "select",
        options: ["buyAndHold", "sma"],
      },
      {
        key: "smaMonths",
        kind: "slider",
        min: 2,
        max: 12,
        step: 1,
        unit: "months",
        visible: (s) => s.strategy === "sma",
      },
      {
        key: "borrowFromFuture",
        kind: "switch",
      },
      {
        key: "loanMonths",
        kind: "slider",
        min: 6,
        max: 240,
        step: 6,
        unit: "months",
        visible: (s) => s.borrowFromFuture,
      },
      {
        key: "loanRate",
        kind: "slider",
        min: 0,
        max: 0.15,
        step: 0.0025,
        unit: "percent",
        visible: (s) => s.borrowFromFuture,
      },
    ],
  },
];

/** Settings shared by all scenarios (REQ-002-02), apart from the historical period. */
export const sharedGroups: SharedFieldGroup[] = [
  {
    id: "productCosts",
    fields: [
      {
        key: "terUnleveraged",
        kind: "slider",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "percent",
        isRecommended: (v) => v <= 0.003,
      },
      {
        key: "terLeveraged",
        kind: "slider",
        min: 0,
        max: 0.015,
        step: 0.0001,
        unit: "percent",
        visible: (_, ctx) => ctx.anyLeveraged,
      },
      {
        key: "includeSofr",
        kind: "switch",
        isRecommended: (v) => v,
        visible: (_, ctx) => ctx.anyLeveraged,
      },
      {
        key: "financingSpread",
        kind: "slider",
        min: 0,
        max: 0.02,
        step: 0.0005,
        unit: "percent",
        isRecommended: (v) => v >= 0.002,
        visible: (_, ctx) => ctx.anyLeveraged,
      },
    ],
  },
  {
    id: "tradingCosts",
    fields: [
      {
        key: "orderFee",
        kind: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        unit: "euro",
      },
      {
        key: "bidAskSpread",
        kind: "slider",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "percent",
      },
    ],
  },
  {
    id: "germanTaxes",
    fields: [
      {
        key: "taxesEnabled",
        kind: "switch",
        isRecommended: (v) => v,
      },
      {
        key: "taxRate",
        kind: "slider",
        min: 0,
        max: 0.35,
        step: 0.00025,
        unit: "percent",
        isRecommended: (v) => v >= 0.26 && v <= 0.28,
        visible: (s) => s.taxesEnabled,
      },
      {
        key: "partialExemption",
        kind: "switch",
        isRecommended: (v) => v,
        visible: (s) => s.taxesEnabled,
      },
      {
        key: "allowance",
        kind: "slider",
        min: 0,
        max: 2000,
        step: 50,
        unit: "euro",
        isRecommended: (v) => v === 1000 || v === 2000,
        visible: (s) => s.taxesEnabled,
      },
      {
        key: "baseRate",
        kind: "slider",
        min: 0,
        max: 0.05,
        step: 0.0001,
        unit: "percent",
        isRecommended: near(0.025, 0.01),
        visible: (s) => s.taxesEnabled,
      },
    ],
  },
];

export type GlobalField = Field<keyof GlobalSettings & FieldKey> & {
  visible?: (g: GlobalSettings) => boolean;
};

/** Currency of the simulation; shown with the historical period (REQ-011-01). */
export const currencyField: SharedField = {
  key: "currency",
  kind: "select",
  options: ["EUR", "USD"],
};

export const globalFields: GlobalField[] = [
  {
    key: "horizonYears",
    kind: "slider",
    min: 1,
    max: 40,
    step: 1,
    unit: "years",
  },
  {
    key: "sampling",
    kind: "select",
    options: ["bootstrap", "rolling"],
  },
  {
    key: "blockMonths",
    kind: "slider",
    min: 1,
    max: 120,
    step: 1,
    unit: "months",
    isRecommended: (v) => v >= 12 && v <= 36,
    visible: (g) => g.sampling === "bootstrap",
  },
  {
    key: "paths",
    kind: "slider",
    min: 100,
    max: 10_000,
    step: 100,
    unit: "count",
    isRecommended: (v) => v >= 1000,
    visible: (g) => g.sampling === "bootstrap",
  },
];
