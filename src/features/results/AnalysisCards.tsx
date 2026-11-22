import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatEuroCompact, formatFactor, formatSignedPercent } from "@/lib/format";
import type { Analysis } from "@/simulation/protocol";
import type { LeveragePoint, LeverageSweep } from "@/simulation/simulate";

type Props = { scenario: ResolvedScenario; analysis?: Analysis; loading: boolean };

function Status({ loading, error }: { loading: boolean; error?: string }) {
  if (error) return <p className="text-sm lg:text-xs text-amber-800">{error}</p>;
  return (
    <p className="text-sm lg:text-xs text-muted-foreground">
      {loading ? "Analysing…" : "No data."}
    </p>
  );
}

function LeverageTakeaway({ sweep, invested }: { sweep: LeverageSweep; invested?: number }) {
  const one = sweep.points.find((p) => p.leverage === 1);
  const best = sweep.points.find((p) => p.leverage === sweep.bestLeverage);
  if (!one || !best) return null;
  if (best.leverage === 1) {
    return (
      <p className="mb-3 text-sm" data-testid="leverage-takeaway">
        <span className="font-semibold">1× (no leverage) has the highest median</span> (
        {formatEuro(one.p50)}). On these paths leverage would not have paid off.
      </p>
    );
  }
  const gain = best.p50 / one.p50 - 1;
  const belowPaidIn = invested !== undefined && best.p10 < invested;
  return (
    <p className="mb-3 text-sm" data-testid="leverage-takeaway">
      <span className="font-semibold">{formatFactor(best.leverage)} has the highest median</span>:{" "}
      {formatEuro(best.p50)} vs {formatEuro(one.p50)} with 1×
      {one.p50 > 0 && ` (${formatSignedPercent(gain, 0).replace(" ", "\u00a0")})`}. In the bad case
      (P10) it ends at {formatEuro(best.p10)} vs {formatEuro(one.p10)} with 1×
      {belowPaidIn && ", less than you paid in"}.
    </p>
  );
}

type ExplorerProps = Props & {
  /** Amount paid in over the horizon, drawn as a reference line. */
  invested?: number;
};

/** Which leverage factor would have paid off for the selected scenario (REQ-001-16, REQ-002-04). */
export function LeverageExplorer({ scenario, analysis, loading, invested }: ExplorerProps) {
  const sweep = analysis?.sweep;
  const color = scenarioColor(scenario);
  const rows = sweep?.points.map((p) => ({ ...p, band: [p.p10, p.p90] }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leverage explorer: which factor pays off?</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          The same paths and contributions as “{scenario.params.name}”, but always 100 % in the
          leveraged ETF; only the factor changes from 1× to 3×. Final value after taxes, up to 1,000
          paths.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sweep || !rows || sweep.error || loading ? (
          <Status loading={loading} error={sweep?.error} />
        ) : (
          <>
            <LeverageTakeaway sweep={sweep} invested={invested} />
            <ul
              className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
              aria-label="Legend"
            >
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded" style={{ background: color }} aria-hidden />
                Median (typical outcome)
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-4 rounded-sm"
                  style={{ background: color, opacity: 0.18 }}
                  aria-hidden
                />
                P10 – P90 (bad case – good case: 1 in 10 paths ends below / above)
              </li>
              {invested !== undefined && (
                <li className="flex items-center gap-1.5">
                  <span
                    className="w-4 border-t-2 border-dashed border-muted-foreground"
                    aria-hidden
                  />
                  Paid in
                </li>
              )}
            </ul>
            <ChartContainer config={{}} className="aspect-auto h-60 w-full text-sm lg:text-xs">
              <ComposedChart data={rows} margin={{ left: 12, right: 16, top: 16, bottom: 12 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis
                  dataKey="leverage"
                  type="number"
                  domain={[1, 3]}
                  ticks={[1, 1.5, 2, 2.5, 3]}
                  tickFormatter={(v: number) => `${v}×`}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Leverage factor",
                    position: "insideBottom",
                    offset: -8,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  scale="log"
                  domain={["auto", "auto"]}
                  allowDataOverflow
                  tickFormatter={formatEuroCompact}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  label={{
                    value: "Final value after taxes (log)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -4,
                    style: { textAnchor: "middle" },
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload as LeveragePoint;
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
                        <div className="mb-1 font-medium">
                          Leverage {formatFactor(Number(label))}
                        </div>
                        <div>Good case (P90): {formatEuro(p.p90)}</div>
                        <div className="font-medium">Median: {formatEuro(p.p50)}</div>
                        <div>Bad case (P10): {formatEuro(p.p10)}</div>
                      </div>
                    );
                  }}
                />
                <Area
                  dataKey="band"
                  stroke="none"
                  fill={color}
                  fillOpacity={0.18}
                  isAnimationActive={false}
                />
                {invested !== undefined && invested > 0 && (
                  <ReferenceLine
                    y={invested}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <ReferenceLine
                  x={sweep.bestLeverage}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 3"
                  label={{
                    value: "Highest median",
                    // Keep the label inside the plot at either end of the axis.
                    position: sweep.bestLeverage >= 2 ? "insideTopRight" : "insideTopLeft",
                    fontSize: 12,
                    fill: "var(--muted-foreground)",
                  }}
                />
                <Line
                  dataKey="p50"
                  name="Median"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ChartContainer>
            <p className="mt-2 text-xs lg:text-[11px] text-muted-foreground">
              More leverage widens the band: the good case grows much faster than the median, while
              the bad case shrinks. Pick the factor whose bad case you could live with.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function FactorImpactCard({ scenario, analysis, loading }: Props) {
  const impact = analysis?.factors;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What each factor costs</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          How much higher the median final value of “{scenario.params.name}” would be without each
          factor (up to 1,000 paths).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!impact || impact.error || loading ? (
          <Status loading={loading} error={impact?.error} />
        ) : (
          <>
            <p className="mb-2 text-sm">
              Median final value:{" "}
              <span className="font-semibold">{formatEuro(impact.baseline)}</span>
            </p>
            <ChartContainer config={{}} className="aspect-auto h-56 w-full text-sm lg:text-xs">
              <BarChart data={impact.factors} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.5} />
                <XAxis
                  type="number"
                  tickFormatter={formatEuroCompact}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [formatEuro(Number(v)), "Median cost"]}
                  cursor={{ fillOpacity: 0.3 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="cost"
                  fill={scenarioColor(scenario)}
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
