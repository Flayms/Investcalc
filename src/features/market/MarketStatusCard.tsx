import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/ChartTooltipBox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataText } from "@/features/i18n/datasets";
import { useI18n } from "@/features/i18n/i18n";
import { cn } from "@/lib/utils";
import type { Dataset } from "@/simulation/dataset";
import {
  bearMarkets,
  chartSeries,
  indicators,
  type MarketPhase,
  marketStatus,
  periodStats,
  type TimeFrame,
  type TimeFrameId,
} from "@/simulation/market";

const PHASES: Record<MarketPhase, { className: string; icon: typeof TrendingUpIcon }> = {
  bull: {
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200",
    icon: TrendingUpIcon,
  },
  correction: {
    className: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
    icon: TriangleAlertIcon,
  },
  bear: {
    className: "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200",
    icon: TrendingDownIcon,
  },
};

const SMA_CHART = 10;
/** Longer time frames are drawn on a logarithmic scale. */
const LOG_SCALE_MONTHS = 120;

const signClass = (v: number) =>
  v >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300";

/** Round ticks for a log axis: 1-2-5 steps, or powers of ten over three decades or more. */
function logTicks(min: number, max: number): number[] | undefined {
  const decades = Math.log10(max / min);
  const steps = decades >= 3 ? [1] : decades >= 1 ? [1, 2, 5] : [1, 1.5, 2, 3, 5, 7];
  const ticks: number[] = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const s of steps) {
      const v = s * 10 ** e;
      if (v >= min && v <= max) ticks.push(v);
    }
  }
  return ticks.length >= 2 ? ticks : undefined;
}

type Props = {
  datasets: Record<string, Dataset>;
  dataset: Dataset;
  onDatasetChange: (id: string) => void;
  frames: TimeFrame[];
  frame: TimeFrame;
  onFrameChange: (id: TimeFrameId) => void;
};

export function MarketStatusCard({
  datasets,
  dataset,
  onDatasetChange,
  frames,
  frame,
  onFrameChange,
}: Props) {
  const status = useMemo(() => marketStatus(dataset), [dataset]);
  const ind = useMemo(() => indicators(dataset), [dataset]);
  const bears = useMemo(() => bearMarkets(dataset), [dataset]);
  const phase = PHASES[status.phase];
  const { language, t, format } = useI18n();
  const phaseText = t.market.phases[status.phase];
  const indexName = dataText(t, dataset).name;
  const chart = useMemo(() => chartSeries(dataset, frame.months, SMA_CHART), [dataset, frame]);
  const stats = useMemo(() => periodStats(dataset, frame.months), [dataset, frame]);
  const log = frame.months > LOG_SCALE_MONTHS;
  const values = chart.flatMap((p) => [p.index, p.sma]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const from = chart[0]?.month ?? "";
  // Bear markets from peak to low, clipped to the time frame.
  const offset = dataset.returns.length - chart.length;
  const shaded = bears
    .map((b) => ({
      x1: chart[Math.max(b.peakIndex - offset, 0)]?.month,
      x2: chart[Math.min(b.troughIndex - offset, chart.length - 1)]?.month,
      inFrame: b.troughIndex > offset,
    }))
    .filter((b) => b.inFrame);
  const range = frame.years === undefined ? t.market.since(from) : t.market.lastYears(frame.years);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{t.market.title}</CardTitle>
          <CardDescription className="text-sm lg:text-xs">
            {t.market.description(status.lastMonth)}
          </CardDescription>
        </div>
        <Tabs value={dataset.id} onValueChange={onDatasetChange} className="w-full sm:w-auto">
          <TabsList aria-label={t.market.index} className="w-full sm:w-auto">
            {Object.values(datasets).map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-sm lg:text-xs">
                {dataText(t, d).name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-semibold ${phase.className}`}
            >
              <phase.icon className="size-4" aria-hidden />
              {phaseText.label}
            </span>
            <span className="text-sm lg:text-xs text-muted-foreground">{phaseText.text}</span>
          </div>
          <div>
            <div className="text-sm lg:text-xs text-muted-foreground">
              {t.market.distanceFromHigh}
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {format.signedPercent(status.drawdown)}
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            {status.smas.map((s) => (
              <li key={s.months} className="flex items-center gap-2">
                {s.above ? (
                  <ArrowUpRightIcon
                    className="size-4 text-emerald-700 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <ArrowDownRightIcon
                    className="size-4 text-red-700 dark:text-red-400"
                    aria-hidden
                  />
                )}
                <span>{s.above ? t.market.aboveSma(s.months) : t.market.belowSma(s.months)}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {format.signedPercent(s.distance)}
                </span>
              </li>
            ))}
          </ul>
          <section aria-labelledby="key-indicators" className="space-y-3 border-t pt-4">
            <h3 id="key-indicators" className="text-sm font-semibold">
              {t.market.keyIndicators}
            </h3>
            <dl className="grid grid-cols-4 gap-2">
              {ind.trailing.map((r) => (
                <div key={r.years}>
                  <dt className="text-sm lg:text-xs text-muted-foreground">
                    {t.market.trailing(r.years)}
                  </dt>
                  <dd
                    className={cn(
                      "font-semibold tabular-nums",
                      r.cagr !== null && signClass(r.cagr),
                    )}
                  >
                    {r.cagr === null ? "–" : format.signedPercent(r.cagr)}
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt>{t.market.volatility12m}</dt>
                <dd className="ml-auto text-right tabular-nums">
                  {format.percent(ind.volatility12m)}{" "}
                  <span className="text-muted-foreground">
                    {t.market.longTerm(format.percent(ind.volatilityLongTerm))}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt>{t.market.shortRate}</dt>
                <dd className="ml-auto tabular-nums">{format.percent(ind.shortRate)}</dd>
              </div>
            </dl>
            <p className="text-xs lg:text-[11px] text-muted-foreground">
              {t.market.indicatorsNote}
            </p>
          </section>
        </div>
        <div className="min-w-0 space-y-3">
          <Tabs value={frame.id} onValueChange={(id) => onFrameChange(id as TimeFrameId)}>
            <TabsList aria-label={t.market.timeFrame} className="w-full sm:w-auto">
              {frames.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  disabled={!f.available}
                  className="text-sm lg:text-xs"
                >
                  {t.market.timeFrameTab(f.years)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-(--series-1)" aria-hidden />{" "}
              {t.market.indexLegend(indexName, range, log)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />{" "}
              {t.market.sma(SMA_CHART)}
            </span>
            {shaded.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm bg-red-500/20" aria-hidden />{" "}
                {t.market.bearMarket}
              </span>
            )}
          </div>
          <ChartContainer config={{}} className="aspect-auto h-56 w-full text-sm lg:text-xs">
            <LineChart data={chart} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={language === "de" ? 60 : 44}
                scale={log ? "log" : "auto"}
                domain={log ? [lo, hi] : ["auto", "auto"]}
                ticks={log ? logTicks(lo, hi) : undefined}
                tickFormatter={(v: number) => format.compact(v)}
                allowDataOverflow={log}
              />
              {shaded.map((b) => (
                <ReferenceArea
                  key={b.x1}
                  x1={b.x1}
                  x2={b.x2}
                  fill="var(--color-red-500)"
                  fillOpacity={0.15}
                  ifOverflow="hidden"
                />
              ))}
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltipBox>
                      <div className="mb-1 font-medium">{label}</div>
                      {payload.map((p) => (
                        <ChartTooltipRow
                          key={String(p.dataKey)}
                          color={String(p.color)}
                          name={p.name}
                          value={format.number(Number(p.value), 1)}
                        />
                      ))}
                    </ChartTooltipBox>
                  ) : null
                }
              />
              <Line
                dataKey="index"
                name={indexName}
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="sma"
                name={t.market.sma(SMA_CHART)}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <section aria-label={t.market.selectedTimeFrame}>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: t.market.totalReturn,
                  value: stats.totalReturn,
                  signed: true,
                  text: format.gain(stats.totalReturn),
                },
                {
                  label: t.market.cagr,
                  value: stats.cagr,
                  signed: true,
                  text: format.signedPercent(stats.cagr),
                },
                {
                  label: t.market.volatility,
                  value: stats.volatility,
                  signed: false,
                  text: format.percent(stats.volatility),
                },
                {
                  label: t.market.maxDrawdown,
                  value: stats.maxDrawdown,
                  signed: true,
                  text: format.signedPercent(stats.maxDrawdown),
                },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-sm lg:text-xs text-muted-foreground">{s.label}</dt>
                  <dd className={cn("font-semibold tabular-nums", s.signed && signClass(s.value))}>
                    {s.text}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-1 text-xs lg:text-[11px] text-muted-foreground">
              {stats.from} – {stats.to}
            </p>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
