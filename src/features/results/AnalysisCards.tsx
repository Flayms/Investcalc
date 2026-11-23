import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/ChartTooltipBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { errorText } from "@/features/i18n/errors";
import { useI18n } from "@/features/i18n/i18n";
import { Stale, UpdatingBadge } from "@/features/results/Updating";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import type { FactorImpact } from "@/simulation/simulate";

type Props = { scenario: ResolvedScenario; factors?: FactorImpact; updating: boolean };

/** How much each cost factor lowers the median of the selected scenario (REQ-001-20). */
export function FactorImpactCard({ scenario, factors: impact, updating }: Props) {
  const { language, t, format } = useI18n();
  const rows = impact?.factors.map((f) => ({ ...f, label: t.factors.names[f.id] }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {t.factors.title} <UpdatingBadge updating={updating} />
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {t.factors.description(scenario.params.name)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!impact ? (
          <p className="text-sm lg:text-xs text-muted-foreground">
            {updating ? t.common.analysing : t.common.noData}
          </p>
        ) : impact.error ? (
          <p className="text-sm lg:text-xs text-amber-800 dark:text-amber-300">
            {errorText(t, format, impact.error)}
          </p>
        ) : (
          <Stale updating={updating}>
            <p className="mb-2 text-sm">
              {t.factors.medianFinalValue}{" "}
              <span className="font-semibold">{format.euro(impact.baseline)}</span>
            </p>
            <ChartContainer config={{}} className="aspect-auto h-56 w-full text-sm lg:text-xs">
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.5} />
                <XAxis
                  type="number"
                  tickFormatter={format.euroCompact}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={language === "de" ? 160 : 120}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fillOpacity: 0.3 }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox>
                        <div className="mb-1 font-medium">{label}</div>
                        <ChartTooltipRow
                          color={scenarioColor(scenario)}
                          name={t.factors.medianCost}
                          value={format.euro(Number(payload[0]?.value))}
                        />
                      </ChartTooltipBox>
                    ) : null
                  }
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
