import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { dataText } from "@/features/i18n/datasets";
import { useI18n } from "@/features/i18n/i18n";
import { HelpTooltip } from "@/features/scenarios/FieldControl";
import type { SharedSettings } from "@/features/scenarios/scenario";
import { type Dataset, firstYear, lastYear } from "@/simulation/dataset";

type Period = Pick<SharedSettings, "fromYear" | "toYear">;
type Props = {
  datasets: Record<string, Dataset>;
  value: Period;
  onChange: (period: Period) => void;
  /** First year of the history in euros, when simulating in euros (REQ-011-04). */
  euroFrom?: number;
};

/** One historical period for all scenarios, spanning all indices (REQ-002-02). */
export function HistoricalPeriodField({ datasets, value, onChange, euroFrom }: Props) {
  const { t } = useI18n();
  const all = Object.values(datasets);
  const min = Math.min(...all.map(firstYear));
  const max = Math.max(...all.map(lastYear));
  const from = Math.max(min, Math.min(value.fromYear, max));
  const to = Math.min(max, Math.max(value.toYear, from));
  const shortest = all.filter((d) => firstYear(d) > from);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm lg:text-xs font-medium">{t.historicalPeriod.label}</Label>
        <HelpTooltip
          label={t.historicalPeriod.label}
          help={t.historicalPeriod.help}
          recommendation={t.historicalPeriod.recommendation}
        />
        <span className="ml-auto text-sm lg:text-xs tabular-nums text-muted-foreground">
          {from}–{to}
        </span>
      </div>
      <Slider
        aria-label={t.historicalPeriod.label}
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={1}
        value={[from, to]}
        onValueChange={([fromYear, toYear]) =>
          fromYear !== undefined && toYear !== undefined && onChange({ fromYear, toYear })
        }
      />
      {shortest.length > 0 && (
        <p className="text-xs lg:text-[11px] text-muted-foreground">
          {shortest
            .map((d) => t.historicalPeriod.indexFrom(dataText(t, d).name, firstYear(d)))
            .join(", ")}
          .
        </p>
      )}
      {euroFrom !== undefined && euroFrom > from && (
        <p className="text-xs lg:text-[11px] text-muted-foreground">
          {t.historicalPeriod.euroFrom(euroFrom)}
        </p>
      )}
    </div>
  );
}
