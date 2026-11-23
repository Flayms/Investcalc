import { ActivityIcon, ChartPieIcon, GaugeIcon, type LucideIcon } from "lucide-react";
import { type SliderField, scenarioGroups } from "@/features/scenarios/fields";
import type { ScenarioChoices } from "@/features/scenarios/scenario";
import { formatFactor } from "@/lib/format";
import type { Goal, SweepParam, SweepPoint } from "@/simulation/sweep";

/** How the value explorer presents one slider; label and range come from the slider itself. */
export type ExploredSlider = {
  param: SweepParam;
  label: string;
  /** Shown next to the slider and on the explorer tab, so both read as one (REQ-008-05). */
  icon: LucideIcon;
  min: number;
  max: number;
  format: (v: number) => string;
};

const sliderField = (key: SweepParam) => {
  for (const g of scenarioGroups)
    for (const f of g.fields) if (f.key === key && f.kind === "slider") return f;
  throw new Error(`no slider ${key}`);
};

const fromField = (
  param: SweepParam,
  icon: LucideIcon,
  format: (v: number) => string,
): ExploredSlider => {
  const f: SliderField<keyof ScenarioChoices> = sliderField(param);
  return { param, label: f.label, icon, min: f.min, max: f.max, format };
};

export const EXPLORED: Record<SweepParam, ExploredSlider> = {
  leveragedShare: fromField("leveragedShare", ChartPieIcon, (v) => `${Math.round(v * 100)} %`),
  leverage: fromField("leverage", GaugeIcon, formatFactor),
  smaMonths: fromField("smaMonths", ActivityIcon, (v) => `${v} months`),
};

export const isExplored = (key: string): key is SweepParam => key in EXPLORED;

export const GOALS: { id: Goal; label: string; short: string; help: string }[] = [
  {
    id: "median",
    label: "Highest median",
    short: "Median",
    help: "The typical outcome: half of the paths end above, half below.",
  },
  {
    id: "badCase",
    label: "Best bad case (P10)",
    short: "Bad case (P10)",
    help: "The outcome only 1 in 10 paths ends below: how bad it gets in a bad decade.",
  },
  {
    id: "loss",
    label: "Lowest chance of loss",
    short: "Chance of loss",
    help: "How often you end with less than you paid in.",
  },
];

/** The value of a point that a goal looks at. */
export const goalValue = (goal: Goal, p: SweepPoint) =>
  goal === "median" ? p.p50 : goal === "badCase" ? p.p10 : p.lossProbability;
