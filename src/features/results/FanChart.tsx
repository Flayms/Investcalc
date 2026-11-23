import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/ChartTooltipBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Stale, UpdatingBadge } from "@/features/results/Updating";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import type { ScenarioResult } from "@/simulation/simulate";

type Props = {
  scenarios: ResolvedScenario[];
  results: Record<string, ScenarioResult>;
  selectedKey: string;
  /** Results are being recalculated (REQ-009-02). */
  updating?: boolean;
};

type Row = Record<string, number | [number, number]>;

export function FanChart({ scenarios, results, selectedKey, updating = false }: Props) {
  const shown = scenarios.filter((s) => results[s.key] && !results[s.key]?.error);
  const selected = shown.find((s) => s.key === selectedKey);
  const resultOf = (s: ResolvedScenario) => results[s.key] as ScenarioResult;
  const months = shown[0] ? resultOf(shown[0]).bands.length - 1 : 0;

  const steps: number[] = [];
  for (let m = 0; m < months; m += 3) steps.push(m);
  steps.push(months);

  const rows: Row[] = [];
  for (const m of steps) {
    const row: Row = { year: m / 12 };
    for (const s of shown) {
      const b = resultOf(s).bands[m];
      if (!b) continue;
      row[s.key] = b.p50;
      if (s.key === selectedKey) {
        row.outer = [b.p10, b.p90];
        row.inner = [b.p25, b.p75];
        row.paid = s.params.initialInvestment + s.params.monthlyContribution * m;
      }
    }
    rows.push(row);
  }

  const color = selected ? scenarioColor(selected) : "#888";

  return (
    <Card className="taped">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Net worth over time <UpdatingBadge updating={updating} />
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          Median of every scenario. Bands for the selected scenario: P25–P75 (dark) and P10–P90
          (light). Before the final sale's taxes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Stale updating={updating}>
          <ul
            className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
            aria-label="Legend"
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
            {selected && (
              <li className="flex items-center gap-1.5">
                <span
                  className="w-4 border-t-2 border-dashed border-muted-foreground"
                  aria-hidden
                />
                Paid in
              </li>
            )}
          </ul>
          <ChartContainer
            config={{}}
            className="aspect-auto h-64 w-full text-sm sm:h-80 lg:text-xs"
          >
            <ComposedChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="year"
                type="number"
                domain={[0, months / 12]}
                tickFormatter={(v: number) => `${v}y`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatEuroCompact(v)}
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
                      <div className="mb-1 font-medium">Year {Number(label).toFixed(1)}</div>
                      {shown.map((s) => (
                        <ChartTooltipRow
                          key={s.key}
                          color={scenarioColor(s)}
                          name={s.params.name}
                          value={formatEuro(row[s.key] as number)}
                        />
                      ))}
                      {selected && Array.isArray(row.outer) && (
                        <div className="mt-1 border-t pt-1 text-muted-foreground">
                          {selected.params.name} P10–P90: {formatEuroCompact(row.outer[0])} –{" "}
                          {formatEuroCompact(row.outer[1])}
                          <br />
                          Paid in: {formatEuro(row.paid as number)}
                        </div>
                      )}
                    </ChartTooltipBox>
                  );
                }}
              />
              {selected && (
                <>
                  <Area
                    dataKey="outer"
                    stroke="none"
                    fill={color}
                    fillOpacity={0.12}
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="inner"
                    stroke="none"
                    fill={color}
                    fillOpacity={0.22}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="paid"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
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
            </ComposedChart>
          </ChartContainer>
        </Stale>
      </CardContent>
    </Card>
  );
}
