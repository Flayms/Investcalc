import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Stale, UpdatingBadge } from "@/features/results/Updating";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import type { FactorImpact } from "@/simulation/simulate";

type Props = { scenario: ResolvedScenario; factors?: FactorImpact; updating: boolean };

/** How much each cost factor lowers the median of the selected scenario (REQ-001-20). */
export function FactorImpactCard({ scenario, factors: impact, updating }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          What each factor costs <UpdatingBadge updating={updating} />
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          How much higher the median final value of “{scenario.params.name}” would be without each
          factor (up to 1,000 paths).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!impact ? (
          <p className="text-sm lg:text-xs text-muted-foreground">
            {updating ? "Analysing…" : "No data."}
          </p>
        ) : impact.error ? (
          <p className="text-sm lg:text-xs text-amber-800 dark:text-amber-300">{impact.error}</p>
        ) : (
          <Stale updating={updating}>
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
          </Stale>
        )}
      </CardContent>
    </Card>
  );
}
