import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSignedPercent } from "@/lib/format";
import { type Dataset, getDataset, monthLabel } from "@/simulation/dataset";
import { type MarketPhase, marketStatus } from "@/simulation/market";

const PHASES: Record<
  MarketPhase,
  { label: string; className: string; icon: typeof TrendingUpIcon; text: string }
> = {
  bull: {
    label: "Bull market",
    className: "bg-emerald-100 text-emerald-900",
    icon: TrendingUpIcon,
    text: "Less than 10 % below the all-time high.",
  },
  correction: {
    label: "Correction",
    className: "bg-amber-100 text-amber-900",
    icon: TriangleAlertIcon,
    text: "10–20 % below the all-time high.",
  },
  bear: {
    label: "Bear market",
    className: "bg-red-100 text-red-900",
    icon: TrendingDownIcon,
    text: "20 % or more below the all-time high.",
  },
};

const CHART_MONTHS = 60;
const SMA_CHART = 10;

export function MarketStatusCard({ datasets }: { datasets: Record<string, Dataset> }) {
  const [id, setId] = useState("sp500");
  const dataset = getDataset(datasets, id);
  const status = useMemo(() => marketStatus(dataset), [dataset]);
  const phase = PHASES[status.phase];

  const chart = useMemo(() => {
    const levels: number[] = [];
    let level = 1;
    for (const r of dataset.returns) {
      level *= 1 + r;
      levels.push(level);
    }
    const n = levels.length;
    return levels.slice(n - CHART_MONTHS).map((v, j) => {
      const i = n - CHART_MONTHS + j;
      const win = levels.slice(i - SMA_CHART + 1, i + 1);
      const base = levels[n - CHART_MONTHS] ?? 1;
      return {
        month: monthLabel(dataset, i),
        index: (v / base) * 100,
        sma: (win.reduce((a, b) => a + b, 0) / win.length / base) * 100,
      };
    });
  }, [dataset]);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Current market</CardTitle>
          <CardDescription className="text-sm lg:text-xs">
            Based on the latest data month ({status.lastMonth}), total return in USD.
          </CardDescription>
        </div>
        <Tabs value={id} onValueChange={setId} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            {Object.values(datasets).map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-sm lg:text-xs">
                {d.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
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
                  <ArrowUpRightIcon className="size-4 text-emerald-700" aria-hidden />
                ) : (
                  <ArrowDownRightIcon className="size-4 text-red-700" aria-hidden />
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
          <p className="text-xs lg:text-[11px] text-muted-foreground">
            The SMA strategy is invested while the index is above its SMA. Not investment advice.
          </p>
        </div>
        <div>
          <div className="mb-1 flex gap-4 text-sm lg:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[#2a78d6]" aria-hidden /> {dataset.name} (last 5
              years, start = 100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />{" "}
              {SMA_CHART}-month SMA
            </span>
          </div>
          <ChartContainer config={{}} className="aspect-auto h-44 w-full text-sm lg:text-xs">
            <LineChart data={chart} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v, name) => [Number(v).toFixed(1), String(name)]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                dataKey="index"
                name={dataset.name}
                stroke="#2a78d6"
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
        </div>
      </CardContent>
    </Card>
  );
}
