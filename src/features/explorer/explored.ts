import { ActivityIcon, ChartPieIcon, GaugeIcon, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/features/i18n/i18n";
import type { Messages } from "@/features/i18n/messages/en";
import { scenarioGroups } from "@/features/scenarios/fields";
import type { Format } from "@/lib/format";
import { type Goal, SWEEP_PARAMS, type SweepParam, type SweepPoint } from "@/simulation/sweep";

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

const ICONS: Record<SweepParam, LucideIcon> = {
  leveragedShare: ChartPieIcon,
  leverage: GaugeIcon,
  smaMonths: ActivityIcon,
};

const sliderField = (key: SweepParam) => {
  for (const g of scenarioGroups)
    for (const f of g.fields) if (f.key === key && f.kind === "slider") return f;
  throw new Error(`no slider ${key}`);
};

/** The explored sliders in the given language. */
export function exploredSliders(t: Messages, format: Format): Record<SweepParam, ExploredSlider> {
  const formats: Record<SweepParam, (v: number) => string> = {
    leveragedShare: (v) => `${Math.round(v * 100)} %`,
    leverage: format.factor,
    smaMonths: t.explorer.months,
  };
  const slider = (param: SweepParam): ExploredSlider => {
    const f = sliderField(param);
    const label = t.fields[param].label;
    return { param, label, icon: ICONS[param], min: f.min, max: f.max, format: formats[param] };
  };
  return {
    leveragedShare: slider("leveragedShare"),
    leverage: slider("leverage"),
    smaMonths: slider("smaMonths"),
  };
}

/** The explored sliders in the selected language. */
export function useExplored() {
  const { t, format } = useI18n();
  return useMemo(() => exploredSliders(t, format), [t, format]);
}

export const isExplored = (key: string): key is SweepParam =>
  (SWEEP_PARAMS as string[]).includes(key);

/** The goals in display order; their labels are `t.goals` (REQ-008-03). */
export const GOALS: Goal[] = ["median", "badCase", "loss"];

/** The value of a point that a goal looks at. */
export const goalValue = (goal: Goal, p: SweepPoint) =>
  goal === "median" ? p.p50 : goal === "badCase" ? p.p10 : p.lossProbability;
