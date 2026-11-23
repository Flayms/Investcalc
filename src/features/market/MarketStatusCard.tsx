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
import { formatCompact, formatGain, formatPercent, formatSignedPercent } from "@/lib/format";
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
} from "@/simulation/market";

const PHASES: Record<
  MarketPhase,
  { label: string; className: string; icon: typeof TrendingUpIcon; text: string }
> = {
  bull: {
    label: "Bull market",
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200",
    icon: TrendingUpIcon,
    text: "Less than 10 % below the all-time high.",
  },
  correction: {
    label: "Correction",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
    icon: TriangleAlertIcon,
    text: "10–20 % below the all-time high.",
  },
  bear: {
    label: "Bear market",
    className: "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200",
    icon: TrendingDownIcon,
    text: "20 % or more below the all-time high.",
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
  onFrameChange: (label: string) => void;
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
  const range = frame.label === "Max" ? `since ${from}` : `last ${frame.months / 12} years`;

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Current market</CardTitle>
          <CardDescription className="text-sm lg:text-xs">
            Based on the latest data month ({status.lastMonth}), total return in USD.
          </CardDescription>
        </div>
        <Tabs value={dataset.id} onValueChange={onDatasetChange} className="w-full sm:w-auto">
          <TabsList aria-label="Index" className="w-full sm:w-auto">
            {Object.values(datasets).map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-sm lg:text-xs">
                {d.name}
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
              {phase.label}
            </span>
            <span className="text-sm lg:text-xs text-muted-foreground">{phase.text}</span>
          </div>
          <div>
            <div className="text-sm lg:text-xs text-muted-foreground">
              Distance from all-time high
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatSignedPercent(status.drawdown)}
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
                <span>
                  {s.above ? "Above" : "Below"} {s.months}-month SMA
                </span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {formatSignedPercent(s.distance)}
                </span>
              </li>
            ))}
          </ul>
          <section aria-labelledby="key-indicators" className="space-y-3 border-t pt-4">
            <h3 id="key-indicators" className="text-sm font-semibold">
              Key indicators
            </h3>
            <dl className="grid grid-cols-4 gap-2">
              {ind.trailing.map((t) => (
                <div key={t.years}>
                  <dt className="text-sm lg:text-xs text-muted-foreground">
                    {t.years}Y{t.years > 1 && " p.a."}
                  </dt>
                  <dd
                    className={cn(
                      "font-semibold tabular-nums",
                      t.cagr !== null && signClass(t.cagr),
                    )}
                  >
                    {t.cagr === null ? "–" : formatSignedPercent(t.cagr)}
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt>Volatility 12 months</dt>
                <dd className="ml-auto text-right tabular-nums">
                  {formatPercent(ind.volatility12m)}{" "}
                  <span className="text-muted-foreground">
                    (long-term {formatPercent(ind.volatilityLongTerm)})
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt>Short rate</dt>
                <dd className="ml-auto tabular-nums">{formatPercent(ind.shortRate)}</dd>
              </div>
            </dl>
            <p className="text-xs lg:text-[11px] text-muted-foreground">
              High volatility raises the drag of leveraged ETFs; the short rate (3-month T-bill,
              SOFR proxy) is what they pay on borrowed money. The SMA strategy is invested while the
              index is above its SMA. Not investment advice.
            </p>
          </section>
        </div>
        <div className="min-w-0 space-y-3">
          <Tabs value={frame.label} onValueChange={onFrameChange}>
            <TabsList aria-label="Time frame" className="w-full sm:w-auto">
              {frames.map((f) => (
                <TabsTrigger
                  key={f.label}
                  value={f.label}
                  disabled={!f.available}
                  className="text-sm lg:text-xs"
                >
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-(--series-1)" aria-hidden /> {dataset.name} (
              {range}, start = 100{log && ", log scale"})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />{" "}
              {SMA_CHART}-month SMA
            </span>
            {shaded.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm bg-red-500/20" aria-hidden /> Bear market
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
                width={44}
                scale={log ? "log" : "auto"}
                domain={log ? [lo, hi] : ["auto", "auto"]}
                ticks={log ? logTicks(lo, hi) : undefined}
                tickFormatter={(v: number) => formatCompact(v)}
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
                          value={Number(p.value).toFixed(1)}
                        />
                      ))}
                    </ChartTooltipBox>
                  ) : null
                }
              />
              <Line
                dataKey="index"
                name={dataset.name}
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="sma"
                name={`${SMA_CHART}-month SMA`}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <section aria-label="Selected time frame">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total return", value: stats.totalReturn, signed: true },
                { label: "CAGR", value: stats.cagr, signed: true },
                { label: "Volatility", value: stats.volatility, signed: false },
                { label: "Max drawdown", value: stats.maxDrawdown, signed: true },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-sm lg:text-xs text-muted-foreground">{s.label}</dt>
                  <dd className={cn("font-semibold tabular-nums", s.signed && signClass(s.value))}>
                    {s.label === "Total return"
                      ? formatGain(s.value)
                      : s.signed
                        ? formatSignedPercent(s.value)
                        : formatPercent(s.value)}
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
