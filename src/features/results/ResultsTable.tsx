import { TrophyIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columnHeat, type Heat, heatStyle } from "@/features/results/heatmap";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import { formatEuro, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/simulation/simulate";

type Props = {
  scenarios: ResolvedScenario[];
  results: Record<string, ScenarioResult>;
  horizonYears: number;
};

const PERCENTILES = ["p5", "p10", "p25", "p50", "p75", "p95"] as const;
type Percentile = (typeof PERCENTILES)[number];

/** Money-weighted yearly return that turns the paid-in amount into `final` (approximation: annuity). */
function annualReturn(final: number, s: ResolvedScenario["params"], years: number): number {
  const months = years * 12;
  const fv = (r: number) =>
    s.initialInvestment * (1 + r) ** months +
    (r === 0
      ? s.monthlyContribution * months
      : (s.monthlyContribution * (1 + r) * ((1 + r) ** months - 1)) / r);
  if (final <= 0) return -1;
  let lo = -0.5;
  let hi = 0.5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (fv(mid) > final) hi = mid;
    else lo = mid;
  }
  return (1 + lo) ** 12 - 1;
}

/** Compact per-scenario card for small screens (the table needs ~1000 px). */
function ResultCard({
  scenario,
  result: r,
  horizonYears,
  heat,
}: {
  scenario: ResolvedScenario;
  result?: ScenarioResult;
  horizonYears: number;
  heat: Partial<Record<Percentile, Heat>>;
}) {
  const nameId = `result-${scenario.key}`;
  const stats = r
    ? [
        ["Paid in", formatEuro(r.invested)],
        ["Median p.a.", formatPercent(annualReturn(r.final.p50, scenario.params, horizonYears))],
        ["P(loss)", formatPercent(r.probabilityOfLoss)],
        ["Fees", formatEuro(r.medianFees)],
        ["Taxes", formatEuro(r.medianTaxes)],
        ["Paths", r.pathCount.toLocaleString("en-US")],
      ]
    : [];
  return (
    <article aria-labelledby={nameId} className="rounded-lg border p-3">
      <h3 id={nameId} className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span
          className="size-2.5 rounded-full"
          style={{ background: scenarioColor(scenario) }}
          aria-hidden
        />
        {scenario.params.name}
      </h3>
      {!r ? (
        <p className="text-sm text-muted-foreground">Simulating…</p>
      ) : r.error ? (
        <p className="text-sm text-amber-800 dark:text-amber-300">{r.error}</p>
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
                    <TrophyIcon className="size-3 shrink-0" role="img" aria-label="Best" />
                  )}
                  {formatEuro(r.final[p])}
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

export function ResultsTable({ scenarios, results, horizonYears }: Props) {
  const finals = scenarios.map((s) => {
    const r = results[s.key];
    return r && !r.error ? r.final : undefined;
  });
  const heat = Object.fromEntries(
    PERCENTILES.map((p) => [p, columnHeat(finals.map((f) => f?.[p]))]),
  ) as Record<Percentile, ReturnType<typeof columnHeat>>;
  const shaded = heat.p50.some((h) => h !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Final value after taxes — percentiles</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          After selling everything at the end of the horizon and paying all taxes and loans. P5 =
          only 5 % of the paths ended lower.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:hidden">
          {scenarios.map((s, row) => (
            <ResultCard
              key={s.key}
              scenario={s}
              result={results[s.key]}
              horizonYears={horizonYears}
              heat={Object.fromEntries(PERCENTILES.map((p) => [p, heat[p][row]]))}
            />
          ))}
        </div>
        <Table className="hidden text-sm md:table lg:text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Scenario</TableHead>
              {PERCENTILES.map((p) => (
                <TableHead key={p} className="text-right">
                  {p.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="text-right">Paid in</TableHead>
              <TableHead className="whitespace-normal text-right">Median p.a.</TableHead>
              <TableHead className="text-right">P(loss)</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead className="text-right">Taxes</TableHead>
              <TableHead className="text-right">Paths</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.map((s, row) => {
              const r = results[s.key];
              return (
                <TableRow key={s.key}>
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
                      Simulating…
                    </TableCell>
                  ) : r.error ? (
                    <TableCell
                      colSpan={12}
                      className="whitespace-normal text-amber-800 dark:text-amber-300"
                    >
                      {r.error}
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
                                  aria-label="Best"
                                />
                              )}
                              {formatEuro(r.final[p])}
                            </span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right tabular-nums">
                        {formatEuro(r.invested)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(annualReturn(r.final.p50, s.params, horizonYears))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(r.probabilityOfLoss)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEuro(r.medianFees)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEuro(r.medianTaxes)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.pathCount.toLocaleString("en-US")}
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
              Shading compares the scenarios per percentile: lighter = lower, darker = higher;{" "}
              <TrophyIcon className="inline size-3 align-[-2px]" aria-hidden /> = best.{" "}
            </>
          )}
          Median p.a. = money-weighted yearly return of the median path. P(loss) = share of paths
          ending below the amount paid in. Fees and taxes are medians over all paths.
        </p>
      </CardContent>
    </Card>
  );
}
