import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/ChartTooltipBox";
import { ChartContainer } from "@/components/ui/chart";
import { annualReturn } from "@/features/results/annualReturn";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatEuroCompact, formatPercent } from "@/lib/format";
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
  const format = pa ? (v: number) => formatPercent(v) : formatEuro;

  const rows: Row[] = DISTRIBUTION_PERCENTILES.map((p, i) => {
    const row = { p } as Row;
    for (const s of shown) {
      const v = results[s.key]?.distribution?.[i];
      if (v === undefined) continue;
      row[s.key] = pa ? annualReturn(v, s.params, horizonYears) : v;
    }
    return row;
  });

  const reference = pa ? 0 : paidIn;
  const referenceLabel = pa ? "Paid in (0 % p.a.)" : "Paid in";
  const measure = pa ? "Yearly return" : "Final value after taxes";

  return (
    <div className="mb-4">
      <ul
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
        aria-label="Percentile chart legend"
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
      <div role="img" aria-label={`${measure} by percentile, P1 to P99, per scenario`}>
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
              tickFormatter={(v: number) => (pa ? formatPercent(v, 0) : formatEuroCompact(v))}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as Row;
                return (
                  <ChartTooltipBox>
                    <div className="mb-1 font-medium">P{label}</div>
                    {shown.map((s) => (
                      <ChartTooltipRow
                        key={s.key}
                        color={scenarioColor(s)}
                        name={s.params.name}
                        value={row[s.key] === undefined ? "–" : format(row[s.key] as number)}
                      />
                    ))}
                    <div className="mt-1 border-t pt-1 text-muted-foreground">
                      {label}% of the paths ended lower.
                    </div>
                  </ChartTooltipBox>
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
