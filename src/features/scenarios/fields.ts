import type { ScenarioChoices, SharedSettings } from "@/features/scenarios/scenario";
import type { GlobalSettings } from "@/simulation/params";

export type Unit = "percent" | "euro" | "factor" | "months" | "years" | "count";

type Base<K> = {
  key: K;
  label: string;
  /** Tooltip: what the setting means. */
  help: string;
  /** Tooltip: the recommended value and why. */
  recommendation?: string;
};

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
  options: { value: string; label: string }[];
};

export type Field<K> = SliderField<K> | SwitchField<K> | SelectField<K>;

export type ScenarioField = Field<keyof ScenarioChoices> & {
  /** Only shown when this returns true. */
  visible?: (s: ScenarioChoices) => boolean;
};

export type FieldGroup = { title: string; fields: ScenarioField[] };

export type SharedContext = {
  /** At least one scenario uses a leveraged ETF. */ anyLeveraged: boolean;
};

export type SharedField = Field<keyof SharedSettings> & {
  /** Only shown when this returns true. */
  visible?: (s: SharedSettings, ctx: SharedContext) => boolean;
};

export type SharedFieldGroup = { title: string; fields: SharedField[] };

const near = (target: number, tolerance: number) => (v: number) =>
  Math.abs(v - target) <= tolerance;

export const scenarioGroups: FieldGroup[] = [
  {
    title: "Savings plan",
    fields: [
      {
        key: "monthlyContribution",
        kind: "slider",
        label: "Monthly investment",
        help: "Amount invested every month on the same date (savings plan / DCA).",
        min: 0,
        max: 5000,
        step: 25,
        unit: "euro",
      },
      {
        key: "initialInvestment",
        kind: "slider",
        label: "Initial investment",
        help: "One-off amount invested at the start.",
        min: 0,
        max: 200_000,
        step: 1000,
        unit: "euro",
      },
    ],
  },
  {
    title: "ETF mix & leverage",
    fields: [
      {
        key: "leveragedShare",
        kind: "slider",
        label: "Share in leveraged ETF",
        help: "Part of every contribution that goes into the leveraged ETF; the rest goes into the 1× ETF. 0 % = only 1×, 100 % = only leveraged. No rebalancing.",
        recommendation:
          "Depends on your risk tolerance. Compare 0 %, 50 % and 100 % as separate scenarios.",
        min: 0,
        max: 1,
        step: 0.05,
        unit: "percent",
      },
      {
        key: "leverage",
        kind: "slider",
        label: "Leverage factor",
        help: "Daily-reset factor of the leveraged ETF (real products: 2× or 3×). Includes volatility drag: the daily reset loses value in choppy markets, roughly (L²−L)/2 × variance per year.",
        recommendation: "See the leverage explorer below for the factor with the best median.",
        min: 1,
        max: 3,
        step: 0.05,
        unit: "factor",
        visible: (s) => s.leveragedShare > 0,
      },
    ],
  },
  {
    title: "Strategy",
    fields: [
      {
        key: "strategy",
        kind: "select",
        label: "Timing",
        help: "Buy and hold never sells. SMA sells everything when the index closes a month below its simple moving average and buys back when it closes above.",
        recommendation:
          "Buy and hold for 1×. SMA can reduce crash risk of leveraged ETFs but triggers taxes and costs.",
        options: [
          { value: "buyAndHold", label: "Buy and hold" },
          { value: "sma", label: "SMA trend filter" },
        ],
      },
      {
        key: "smaMonths",
        kind: "slider",
        label: "SMA window",
        help: "Length of the simple moving average in months (10 months ≈ 200 trading days).",
        recommendation: "10 months (classic 200-day line).",
        min: 2,
        max: 12,
        step: 1,
        unit: "months",
        visible: (s) => s.strategy === "sma",
      },
      {
        key: "borrowFromFuture",
        kind: "switch",
        label: "Borrow from your future self",
        help: "Take a loan worth the next N monthly contributions and invest it immediately; the contributions then repay the loan. Compares 'invest as early as possible' with the plain savings plan.",
        recommendation: "Off by default. Only pays off when returns beat the loan rate.",
      },
      {
        key: "loanMonths",
        kind: "slider",
        label: "Loan term",
        help: "Number of future monthly contributions borrowed and invested up front.",
        min: 6,
        max: 240,
        step: 6,
        unit: "months",
        visible: (s) => s.borrowFromFuture,
      },
      {
        key: "loanRate",
        kind: "slider",
        label: "Loan interest rate",
        help: "Yearly interest rate of the loan (e.g. consumer credit or Lombard loan).",
        recommendation: "German consumer loans: ~5–8 %.",
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
    title: "Product costs",
    fields: [
      {
        key: "terUnleveraged",
        kind: "slider",
        label: "TER 1× ETF",
        help: "Total expense ratio per year of the unleveraged ETF, deducted monthly.",
        recommendation: "0.07–0.25 % for large World / S&P 500 ETFs. Default 0.20 %.",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "percent",
        isRecommended: (v) => v <= 0.003,
      },
      {
        key: "terLeveraged",
        kind: "slider",
        label: "TER leveraged ETF",
        help: "Total expense ratio per year of the leveraged ETF.",
        recommendation: "Typical 0.35–0.75 %. Default 0.60 %.",
        min: 0,
        max: 0.015,
        step: 0.0001,
        unit: "percent",
        visible: (_, ctx) => ctx.anyLeveraged,
      },
      {
        key: "includeSofr",
        kind: "switch",
        label: "Include SOFR financing",
        help: "A leveraged ETF borrows (L − 1) × its assets and pays the short rate (SOFR; historically the 3-month T-bill rate) on it.",
        recommendation:
          "Keep on. Real leveraged ETFs always pay financing; switching it off only shows its influence.",
        isRecommended: (v) => v,
        visible: (_, ctx) => ctx.anyLeveraged,
      },
      {
        key: "financingSpread",
        kind: "slider",
        label: "Financing spread over SOFR",
        help: "Extra yearly swap cost above SOFR on the borrowed part.",
        recommendation: "0.3–1 % for real products. Default 0.5 %.",
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
    title: "Trading costs",
    fields: [
      {
        key: "orderFee",
        kind: "slider",
        label: "Order fee",
        help: "Fixed fee per order (every monthly purchase, every sale).",
        recommendation: "€0–1.50 for savings plans at German online brokers. Default €1.",
        min: 0,
        max: 10,
        step: 0.5,
        unit: "euro",
      },
      {
        key: "bidAskSpread",
        kind: "slider",
        label: "Bid-ask spread",
        help: "Difference between buy and sell price. Half of it is paid on every buy and every sale.",
        recommendation: "0.02–0.2 % for liquid ETFs. Default 0.10 %.",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "percent",
      },
    ],
  },
  {
    title: "German taxes",
    fields: [
      {
        key: "taxesEnabled",
        kind: "switch",
        label: "Apply German taxes",
        help: "Abgeltungsteuer on realised gains, Vorabpauschale every year, loss carry-forward.",
        recommendation: "Keep on; switch off only to see the influence of taxes.",
        isRecommended: (v) => v,
      },
      {
        key: "taxRate",
        kind: "slider",
        label: "Tax rate",
        help: "Abgeltungsteuer 25 % + 5.5 % Solidaritätszuschlag = 26.375 %. With church tax ≈ 27.8–28 %.",
        recommendation: "26.375 % (27.82 % / 27.99 % with church tax).",
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
        label: "Teilfreistellung (30 %)",
        help: "30 % of gains of equity funds (≥ 51 % equities) are tax-free. Assumed for leveraged ETFs too.",
        recommendation: "On for equity ETFs.",
        isRecommended: (v) => v,
        visible: (s) => s.taxesEnabled,
      },
      {
        key: "allowance",
        kind: "slider",
        label: "Tax allowance",
        help: "Sparerpauschbetrag per year: income up to this amount is tax-free.",
        recommendation: "€1,000 single, €2,000 jointly assessed couples.",
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
        label: "Basiszins",
        help: "Base rate for the Vorabpauschale (value at the start of the year × Basiszins × 0.7, at most the year's gain). Set yearly by the Bundesbank.",
        recommendation: "Recent years: 2.29 % (2024), 2.53 % (2025). Default 2.5 %.",
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

export type GlobalField = Field<keyof GlobalSettings> & {
  visible?: (g: GlobalSettings) => boolean;
};

/** Currency of the simulation; shown with the historical period (REQ-011-01). */
export const currencyField: SharedField = {
  key: "currency",
  kind: "select",
  label: "Currency",
  help: "Currency you invest and pay taxes in. In euros, every month's index return is converted with that month's change of the euro/dollar rate (before 1999 via the D-Mark). Leveraged ETFs apply their leverage to the dollar return; the currency effect is not leveraged. Cash earns the German / euro money market rate.",
  recommendation:
    "Euro for investors in Germany: the currency risk of US and world equities is part of your result. US dollar shows the index alone and the longer history.",
  options: [
    { value: "EUR", label: "Euro" },
    { value: "USD", label: "US dollar" },
  ],
};

/** Inflation adjustment of all results; shown with the currency (REQ-013-01). */
export const inflationField: SharedField = {
  key: "inflationAdjusted",
  kind: "switch",
  label: "Adjust for inflation",
  help: "Shows all amounts in purchasing power at the start of the investment: each amount is divided by the rise in consumer prices up to its month, following the inflation of the same historical months (German prices in euros, US prices in dollars). Taxes are still computed on nominal gains.",
  recommendation:
    "On: over 20–30 years inflation roughly halves what a euro buys, so nominal amounts look much better than they are.",
  isRecommended: (v) => v,
};

export const globalFields: GlobalField[] = [
  {
    key: "horizonYears",
    kind: "slider",
    label: "Horizon",
    help: "How long you invest. All scenarios use the same horizon.",
    min: 1,
    max: 40,
    step: 1,
    unit: "years",
  },
  {
    key: "sampling",
    kind: "select",
    label: "Path generation",
    help: "Historical windows: every real N-year period of the history (few, overlapping paths). Random slicing: thousands of paths stitched together from random blocks of history (block bootstrap).",
    recommendation:
      "Random slicing for robust distributions; historical windows to see what actually happened.",
    options: [
      { value: "bootstrap", label: "Random slicing (block bootstrap)" },
      { value: "rolling", label: "Historical windows" },
    ],
  },
  {
    key: "blockMonths",
    kind: "slider",
    label: "Mean block length",
    help: "Average length of the random history blocks. Blocks keep crashes, volatility regimes and interest rates together; single months would destroy them.",
    recommendation: "12–36 months. Default 24.",
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
    label: "Number of paths",
    help: "How many random paths are simulated per scenario. More paths = smoother percentiles, slower.",
    recommendation: "2,000 or more.",
    min: 100,
    max: 10_000,
    step: 100,
    unit: "count",
    isRecommended: (v) => v >= 1000,
    visible: (g) => g.sampling === "bootstrap",
  },
];
