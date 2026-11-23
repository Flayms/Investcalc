import { TrophyIcon } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorText } from "@/features/i18n/errors";
import { type I18n, useI18n } from "@/features/i18n/i18n";
import { annualReturn } from "@/features/results/annualReturn";
import { DistributionChart, type ResultUnit } from "@/features/results/DistributionChart";
import { columnHeat, type Heat, heatStyle } from "@/features/results/heatmap";
import { Stale, staleClass, UpdatingBadge } from "@/features/results/Updating";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/simulation/simulate";

type Props = {
  scenarios: ResolvedScenario[];
  results: Record<string, ScenarioResult>;
  selectedKey: string;
  /** Keys of the scenarios whose results are being recalculated (REQ-009-02, REQ-009-04). */
  updating?: readonly string[];
  horizonYears: number;
};

const PERCENTILES = ["p5", "p10", "p25", "p50", "p75", "p95"] as const;
type Percentile = (typeof PERCENTILES)[number];

/** What a percentile cell shows: the amount or its money-weighted yearly return. */
function percentileValue(
  r: ScenarioResult,
  s: ResolvedScenario,
  p: Percentile,
  unit: ResultUnit,
  horizonYears: number,
): number {
  return unit === "eur" ? r.final[p] : annualReturn(r.final[p], s.params, horizonYears);
}

const formatValue = ({ format }: I18n, v: number, unit: ResultUnit) =>
  unit === "eur" ? format.euro(v) : format.percent(v);

function UnitSwitch({ unit, onChange }: { unit: ResultUnit; onChange: (u: ResultUnit) => void }) {
  const { t } = useI18n();
  const units: { id: ResultUnit; label: string }[] = [
    { id: "eur", label: "€" },
    { id: "pa", label: t.results.perYear },
  ];
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring a legend and border we do not want here.
    <div role="group" aria-label={t.results.unit} className="inline-flex rounded-lg bg-muted p-1">
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          aria-pressed={unit === u.id}
          onClick={() => onChange(u.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-sm font-medium transition-colors lg:text-xs",
            unit === u.id ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          {u.label}
        </button>
      ))}
    </div>
  );
}

/** Compact per-scenario card for small screens (the table needs ~1000 px). */
function ResultCard({
  scenario,
  result: r,
  horizonYears,
  heat,
  unit,
  updating,
}: {
  scenario: ResolvedScenario;
  result?: ScenarioResult;
  horizonYears: number;
  heat: Partial<Record<Percentile, Heat>>;
  unit: ResultUnit;
  updating: boolean;
}) {
  const nameId = `result-${scenario.key}`;
  const i18n = useI18n();
  const { t, format } = i18n;
  const stats = r
    ? [
        [t.common.paidIn, format.euro(r.invested)],
        [
          t.results.medianPerYear,
          format.percent(annualReturn(r.final.p50, scenario.params, horizonYears)),
        ],
        [t.results.lossShort, format.percent(r.probabilityOfLoss)],
        [t.results.fees, format.euro(r.medianFees)],
        [t.results.taxes, format.euro(r.medianTaxes)],
        [t.results.paths, format.count(r.pathCount)],
      ]
    : [];
  return (
    <article
      aria-labelledby={nameId}
      aria-busy={updating}
      className={cn("rounded-lg border p-3", staleClass(updating))}
    >
      <h3 id={nameId} className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span
          className="size-2.5 rounded-full"
          style={{ background: scenarioColor(scenario) }}
          aria-hidden
        />
        {scenario.params.name}
      </h3>
      {!r ? (
        <p className="text-sm text-muted-foreground">{t.common.simulating}</p>
      ) : r.error ? (
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {errorText(t, format, r.error)}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
            {PERCENTILES.map((p) => (
              <div key={p} className="rounded px-1.5 py-0.5" style={heat[p] && heatStyle(heat[p])}>
                <dt className={cn("text-xs", heat[p] ? "opacity-80" : "text-muted-foreground")}>
                  {p.toUpperCase()}
                </dt>
                <dd
                  className={cn(
                    "flex items-center gap-0.5 tabular-nums",
                    p === "p50" && "font-semibold",
                  )}
                >
                  {heat[p]?.best && (
                    <TrophyIcon className="size-3 shrink-0" role="img" aria-label={t.common.best} />
                  )}
                  {formatValue(i18n, percentileValue(r, scenario, p, unit, horizonYears), unit)}
                </dd>
              </div>
            ))}
          </dl>
          <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 border-t pt-2 text-sm">
            {stats.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </article>
  );
}

export function ResultsTable({
  scenarios,
  results,
  selectedKey,
  horizonYears,
  updating = [],
}: Props) {
  const [unit, setUnit] = useState<ResultUnit>("eur");
  const i18n = useI18n();
  const { t, format } = i18n;
  const anyUpdating = updating.length > 0;
  const isUpdating = (s: ResolvedScenario) => updating.includes(s.key);
  const value = (s: ResolvedScenario, p: Percentile) => {
    const r = results[s.key];
    return r && !r.error ? percentileValue(r, s, p, unit, horizonYears) : undefined;
  };
  // Shading compares what is shown: with different contributions the order can differ per unit.
  const heat = Object.fromEntries(
    PERCENTILES.map((p) => [p, columnHeat(scenarios.map((s) => value(s, p)))]),
  ) as Record<Percentile, ReturnType<typeof columnHeat>>;
  const shaded = heat.p50.some((h) => h !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {t.results.title} <UpdatingBadge updating={anyUpdating} />
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {t.results.description} {unit === "pa" && t.results.yearlyReturnNote}
        </CardDescription>
        <CardAction>
          <UnitSwitch unit={unit} onChange={setUnit} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Stale updating={anyUpdating}>
          <DistributionChart
            scenarios={scenarios}
            results={results}
            selectedKey={selectedKey}
            horizonYears={horizonYears}
            unit={unit}
          />
        </Stale>
        <div className="space-y-3 md:hidden">
          {scenarios.map((s, row) => (
            <ResultCard
              key={s.key}
              scenario={s}
              result={results[s.key]}
              horizonYears={horizonYears}
              heat={Object.fromEntries(PERCENTILES.map((p) => [p, heat[p][row]]))}
              unit={unit}
              updating={isUpdating(s)}
            />
          ))}
        </div>
        <Table className="hidden text-sm md:table lg:text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>{t.results.scenario}</TableHead>
              {PERCENTILES.map((p) => (
                <TableHead key={p} className="text-right">
                  {p.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="text-right">{t.common.paidIn}</TableHead>
              <TableHead className="whitespace-normal text-right">
                {t.results.medianPerYear}
              </TableHead>
              <TableHead className="text-right">{t.results.lossShort}</TableHead>
              <TableHead className="text-right">{t.results.fees}</TableHead>
              <TableHead className="text-right">{t.results.taxes}</TableHead>
              <TableHead className="text-right">{t.results.paths}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.map((s, row) => {
              const r = results[s.key];
              return (
                <TableRow
                  key={s.key}
                  aria-busy={isUpdating(s)}
                  className={staleClass(isUpdating(s))}
                >
                  <TableCell className="min-w-36 whitespace-normal font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: scenarioColor(s) }}
                        aria-hidden
                      />
                      {s.params.name}
                    </span>
                  </TableCell>
                  {!r ? (
                    <TableCell colSpan={12} className="text-muted-foreground">
                      {t.common.simulating}
                    </TableCell>
                  ) : r.error ? (
                    <TableCell
                      colSpan={12}
                      className="whitespace-normal text-amber-800 dark:text-amber-300"
                    >
                      {errorText(t, format, r.error)}
                    </TableCell>
                  ) : (
                    <>
                      {PERCENTILES.map((p) => {
                        const h = heat[p][row];
                        return (
                          <TableCell
                            key={p}
                            className={`text-right tabular-nums ${p === "p50" ? "font-semibold" : ""}`}
                            style={h && heatStyle(h)}
                          >
                            <span className="inline-flex items-center gap-0.5">
                              {h?.best && (
                                <TrophyIcon
                                  className="size-3 shrink-0"
                                  role="img"
                                  aria-label={t.common.best}
                                />
                              )}
                              {formatValue(i18n, value(s, p) as number, unit)}
                            </span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right tabular-nums">
                        {format.euro(r.invested)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format.percent(annualReturn(r.final.p50, s.params, horizonYears))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format.percent(r.probabilityOfLoss)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format.euro(r.medianFees)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format.euro(r.medianTaxes)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format.count(r.pathCount)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs lg:text-[11px] text-muted-foreground">
          {shaded && (
            <>
              {t.results.shading} <TrophyIcon className="inline size-3 align-[-2px]" aria-hidden />{" "}
              {t.results.isBest}{" "}
            </>
          )}
          {t.results.footnote}
        </p>
      </CardContent>
    </Card>
  );
}
