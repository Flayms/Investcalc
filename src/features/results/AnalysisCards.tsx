import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { type Scenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatEuroCompact, formatFactor } from "@/lib/format";
import type { Analysis } from "@/simulation/protocol";

type Props = { scenario: Scenario; analysis?: Analysis; loading: boolean };

function Status({ loading, error }: { loading: boolean; error?: string }) {
  if (error) return <p className="text-xs text-amber-800">{error}</p>;
  return <p className="text-xs text-muted-foreground">{loading ? "Analysing…" : "No data."}</p>;
}

export function LeverageExplorer({ scenario, analysis, loading }: Props) {
  const sweep = analysis?.sweep;
  const color = scenarioColor(scenario);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leverage explorer</CardTitle>
        <CardDescription className="text-xs">
          “{scenario.params.name}” fully in a leveraged ETF with factor 1×–3×, same paths, after
          taxes. Median (solid), P10 / P90 (dashed), log scale, up to 1,000 paths.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sweep || sweep.error || loading ? (
          <Status loading={loading} error={sweep?.error} />
        ) : (
          <>
            <p className="mb-2 text-sm">
              Highest median:{" "}
              <span className="font-semibold">{formatFactor(sweep.bestLeverage)}</span>
              <span className="text-muted-foreground">
                {" "}
                ({formatEuro(sweep.points.find((p) => p.leverage === sweep.bestLeverage)?.p50 ?? 0)}
                )
              </span>
            </p>
            <ChartContainer config={{}} className="aspect-auto h-56 w-full">
              <LineChart data={sweep.points} margin={{ left: 8, right: 16, top: 8 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis
                  dataKey="leverage"
                  tickFormatter={(v: number) => `${v}×`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  scale="log"
                  domain={["auto", "auto"]}
                  allowDataOverflow
                  tickFormatter={formatEuroCompact}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  formatter={(v, name) => [formatEuro(Number(v)), String(name)]}
                  labelFormatter={(v) => `Leverage ${formatFactor(Number(v))}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <ReferenceLine
                  x={sweep.bestLeverage}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 3"
                />
                <Line
                  dataKey="p90"
                  name="P90"
                  stroke={color}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="p50"
                  name="Median"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="p10"
                  name="P10"
                  stroke={color}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
            <p className="mt-2 text-[11px] text-muted-foreground">
              A higher median usually comes with a much lower P10: check the downside before picking
              the factor.
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
        <CardDescription className="text-xs">
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
            <ChartContainer config={{}} className="aspect-auto h-56 w-full">
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
                  width={130}
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
