import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useI18n } from "@/features/i18n/i18n";
import { yearlyReturn } from "@/features/results/annualReturn";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { DISTRIBUTION_PERCENTILES, type ScenarioResult } from "@/simulation/simulate";

export type ResultUnit = "eur" | "pa";

type Props = {
  scenarios: ResolvedScenario[];
  results: Record<string, ScenarioResult>;
  selectedKey: string;
  horizonYears: number;
  unit: ResultUnit;
};

type Row = { p: number } & Record<string, number>;

const TICKS = [1, 10, 25, 50, 75, 90, 99];

/** Final value after taxes (or its yearly return) against the percentile, one line per scenario. */
export function DistributionChart({ scenarios, results, selectedKey, horizonYears, unit }: Props) {
  const shown = scenarios.filter((s) => results[s.key] && !results[s.key]?.error);
  const selected = shown.find((s) => s.key === selectedKey);
  const paidIn = selected ? results[selected.key]?.invested : undefined;
  const pa = unit === "pa";
  const { language, t, format: f } = useI18n();
  const format = pa ? (v: number) => f.percent(v) : f.euro;

  const rows: Row[] = DISTRIBUTION_PERCENTILES.map((p, i) => {
    const row = { p } as Row;
    for (const s of shown) {
      const r = results[s.key];
      const v = r?.distribution?.[i];
      if (!r || v === undefined) continue;
      row[s.key] = pa ? yearlyReturn(v, s.params, r.invested, horizonYears) : v;
    }
    return row;
  });

  const reference = pa ? 0 : paidIn;
  const referenceLabel = pa ? t.distributionChart.paidInZero : t.common.paidIn;
  const measure = pa ? t.distributionChart.yearlyReturn : t.distributionChart.finalValue;

  return (
    <div className="mb-4">
      <ul
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
        aria-label={t.distributionChart.legend}
      >
        {shown.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded"
              style={{ background: scenarioColor(s) }}
              aria-hidden
            />
            <span className={s.key === selectedKey ? "font-medium text-foreground" : undefined}>
              {s.params.name}
            </span>
          </li>
        ))}
        {reference !== undefined && (
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />
            {referenceLabel}
          </li>
        )}
      </ul>
      <div role="img" aria-label={t.distributionChart.chartLabel(measure)}>
        <ChartContainer config={{}} className="aspect-auto h-56 w-full text-sm sm:h-72 lg:text-xs">
          <LineChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="p"
              type="number"
              domain={[1, 99]}
              ticks={TICKS}
              tickFormatter={(v: number) => `P${v}`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => (pa ? f.percent(v, 0) : f.euroCompact(v))}
              tickLine={false}
              axisLine={false}
              width={language === "de" ? 80 : 64}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as Row;
                return (
                  <div className="rounded-md border bg-background px-3 py-2 text-sm lg:text-xs shadow-md">
                    <div className="mb-1 font-medium">P{label}</div>
                    {shown.map((s) => (
                      <div key={s.key} className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: scenarioColor(s) }}
                          aria-hidden
                        />
                        <span className="text-muted-foreground">{s.params.name}</span>
                        <span className="ml-auto pl-3 tabular-nums">
                          {row[s.key] === undefined ? "–" : format(row[s.key] as number)}
                        </span>
                      </div>
                    ))}
                    <div className="mt-1 border-t pt-1 text-muted-foreground">
                      {t.distributionChart.endedLower(Number(label))}
                    </div>
                  </div>
                );
              }}
            />
            {reference !== undefined && (
              <ReferenceLine
                y={reference}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            {shown.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.params.name}
                stroke={scenarioColor(s)}
                strokeWidth={s.key === selectedKey ? 2.5 : 2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
