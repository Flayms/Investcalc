import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { EXPLORED, type ExploredSlider, GOALS } from "@/features/explorer/explored";
import { Stale, UpdatingBadge } from "@/features/results/Updating";
import { type ResolvedScenario, scenarioColor } from "@/features/scenarios/scenario";
import type { Sweeps } from "@/features/simulation/useSimulation";
import { formatEuro, formatEuroCompact, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScenarioParams } from "@/simulation/params";
import {
  bestPoint,
  type Goal,
  type ParameterSweep,
  SWEEP_PARAMS,
  type SweepParam,
  type SweepPoint,
} from "@/simulation/sweep";

export type ExplorerView = "distribution" | "tradeoff";

type Props = {
  scenario: ResolvedScenario;
  sweeps: Sweeps;
  pending: Record<SweepParam, boolean>;
  param: SweepParam;
  onParamChange: (param: SweepParam) => void;
  goal: Goal;
  onGoalChange: (goal: Goal) => void;
  /** Applies a value to the selected scenario's slider. */
  onApply: (param: SweepParam, value: number) => void;
  /** Briefly highlighted after "Explore" was pressed on a slider. */
  highlight?: boolean;
  view: ExplorerView;
  onViewChange: (view: ExplorerView) => void;
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset aria-label={label} className="inline-flex rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-sm lg:text-xs font-medium transition-colors",
            value === o.id
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}

const ASSUMPTION_TEXT: Partial<Record<keyof ScenarioParams, (v: unknown) => string>> = {
  leveragedShare: (v) => `${Math.round(Number(v) * 100)} % in the leveraged ETF`,
  leverage: (v) => `a ${Number(v)}× leveraged ETF`,
  strategy: () => "the SMA trend filter",
};

/** Sentence about the settings the sweep had to assume (REQ-008-02). */
function assumptionNote(sweep: ParameterSweep) {
  const parts = Object.entries(sweep.assumed).map(([k, v]) =>
    ASSUMPTION_TEXT[k as keyof ScenarioParams]?.(v),
  );
  if (parts.length === 0) return undefined;
  return `This slider has no effect with the scenario's current settings, so the explorer assumes ${parts.join(" and ")}.`;
}

/** The goal's figure of a point, e.g. "€400,000". */
const amount = (goal: Goal, p: SweepPoint) =>
  goal === "loss"
    ? formatPercent(p.lossProbability, 0)
    : formatEuro(goal === "badCase" ? p.p10 : p.p50);

const NOUN: Record<Goal, string> = {
  median: "median",
  badCase: "in the bad case (P10)",
  loss: "chance of loss",
};

const metric = (goal: Goal, p: SweepPoint) => `${amount(goal, p)} ${NOUN[goal]}`;

/** The closest swept point to the scenario's current value. */
function currentPoint(sweep: ParameterSweep, current: number) {
  return sweep.points.reduce<SweepPoint | undefined>(
    (a, p) => (!a || Math.abs(p.value - current) < Math.abs(a.value - current) ? p : a),
    undefined,
  );
}

function Takeaway({
  slider,
  sweep,
  goal,
  current,
  onApply,
}: {
  slider: ExploredSlider;
  sweep: ParameterSweep;
  goal: Goal;
  /** Undefined when the slider has no effect in the scenario (REQ-008-02). */
  current?: number;
  onApply: (value: number) => void;
}) {
  const best = bestPoint(sweep.points, goal);
  const now = current === undefined ? undefined : currentPoint(sweep, current);
  if (!best) return null;
  const goalLabel = GOALS.find((g) => g.id === goal)?.label.toLowerCase();
  const same = best.value === now?.value;
  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2"
      data-testid="explorer-takeaway"
    >
      <p className="text-sm">
        <span className="font-semibold">
          {slider.format(best.value)} has the {goalLabel}
        </span>
        : {metric(goal, best)}
        {!now ? (
          <>
            {goal !== "median" && `, median ${formatEuro(best.p50)}`}
            {goal !== "loss" && `, ${formatPercent(best.lossProbability, 0)} chance of loss`}.
          </>
        ) : same ? (
          <> — that is your current setting.</>
        ) : (
          <>
            {" "}
            vs {amount(goal, now)} at your current {slider.format(now.value)}.{" "}
            {[
              goal !== "median" && `Median ${formatEuro(best.p50)} vs ${formatEuro(now.p50)}`,
              goal !== "badCase" &&
                `bad case (P10) ${formatEuro(best.p10)} vs ${formatEuro(now.p10)}`,
              goal !== "loss" &&
                `chance of loss ${formatPercent(best.lossProbability, 0)} vs ${formatPercent(now.lossProbability, 0)}`,
            ]
              .filter(Boolean)
              .join(", ")
              .replace(/^./, (c) => c.toUpperCase())}
            .
          </>
        )}
      </p>
      {now && !same && (
        <Button size="sm" variant="outline" onClick={() => onApply(best.value)}>
          Use {slider.format(best.value)}
        </Button>
      )}
    </div>
  );
}

function PointTooltip({
  slider,
  p,
  invested,
}: {
  slider: ExploredSlider;
  p: SweepPoint;
  invested: number;
}) {
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">
        {slider.label}: {slider.format(p.value)}
      </div>
      <div>Good case (P90): {formatEuro(p.p90)}</div>
      <div className="font-medium">Median: {formatEuro(p.p50)}</div>
      <div>Bad case (P10): {formatEuro(p.p10)}</div>
      <div>Chance of loss: {formatPercent(p.lossProbability, 1)}</div>
      <div className="text-muted-foreground">Paid in: {formatEuro(invested)}</div>
    </div>
  );
}

/** Distribution of the final value against the slider value (REQ-008-04). */
function DistributionView({
  slider,
  sweep,
  color,
  current,
  best,
}: {
  slider: ExploredSlider;
  sweep: ParameterSweep;
  color: string;
  current?: number;
  best?: SweepPoint;
}) {
  const rows = sweep.points.map((p) => ({
    ...p,
    outer: [p.p5, p.p95],
    mid: [p.p10, p.p90],
    inner: [p.p25, p.p75],
  }));
  const ref = sweep.reference;
  return (
    <>
      <ul
        className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
        aria-label="Legend"
      >
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: color }} aria-hidden />
          Median
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex h-2.5 w-6 overflow-hidden rounded-sm" aria-hidden>
            <span className="flex-1" style={{ background: color, opacity: 0.12 }} />
            <span className="flex-1" style={{ background: color, opacity: 0.25 }} />
            <span className="flex-1" style={{ background: color, opacity: 0.4 }} />
          </span>
          P5–P95 · P10–P90 · P25–P75
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />
          Paid in
        </li>
        {ref && (
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dotted border-foreground/60" aria-hidden />
            {ref.label} (median)
          </li>
        )}
      </ul>
      <ChartContainer
        config={{}}
        className="aspect-auto h-64 w-full text-sm lg:text-xs"
        role="img"
        aria-label={`Final value after taxes by ${slider.label}`}
      >
        <ComposedChart data={rows} margin={{ left: 12, right: 16, top: 20, bottom: 12 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis
            dataKey="value"
            type="number"
            domain={[slider.min, slider.max]}
            tickFormatter={slider.format}
            tickLine={false}
            axisLine={false}
            label={{ value: slider.label, position: "insideBottom", offset: -8, fontSize: 12 }}
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
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <PointTooltip
                  slider={slider}
                  p={payload[0]?.payload as SweepPoint}
                  invested={sweep.invested}
                />
              );
            }}
          />
          <Area
            dataKey="outer"
            stroke="none"
            fill={color}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Area
            dataKey="mid"
            stroke="none"
            fill={color}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          <Area
            dataKey="inner"
            stroke="none"
            fill={color}
            fillOpacity={0.2}
            isAnimationActive={false}
          />
          {sweep.invested > 0 && (
            <ReferenceLine
              y={sweep.invested}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}
          {ref && (
            <ReferenceLine
              y={ref.point.p50}
              stroke="var(--foreground)"
              strokeOpacity={0.6}
              strokeDasharray="1 3"
              strokeWidth={2}
            />
          )}
          {current !== undefined && (
            <ReferenceLine
              x={current}
              stroke="var(--foreground)"
              strokeWidth={1.5}
              label={{ value: "Current", position: "top", fontSize: 12, fill: "var(--foreground)" }}
            />
          )}
          {best && best.value !== current && (
            <ReferenceLine
              x={best.value}
              stroke="var(--muted-foreground)"
              strokeDasharray="2 3"
              label={{
                value: "Best",
                position: "top",
                fontSize: 12,
                fill: "var(--muted-foreground)",
              }}
            />
          )}
          <Line
            dataKey="p50"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
      <p className="mt-2 text-xs lg:text-[11px] text-muted-foreground">
        Each band holds the middle 90 %, 80 % and 50 % of the paths. A wider band means less
        certainty; a value pays off when its median rises without its bad end sinking below what you
        paid in.
      </p>
    </>
  );
}

/** Median against chance of loss, one point per slider value (REQ-008-04). */
function TradeoffView({
  slider,
  sweep,
  color,
  current,
  best,
}: {
  slider: ExploredSlider;
  sweep: ParameterSweep;
  color: string;
  current?: number;
  best?: SweepPoint;
}) {
  const rows = sweep.points.map((p) => ({ ...p, loss: p.lossProbability }));
  const highlight = (p: SweepPoint) => p.value === current || p.value === best?.value;
  return (
    <>
      <ul
        className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:text-xs text-muted-foreground"
        aria-label="Legend"
      >
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />
          One {slider.label.toLowerCase()} value
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-foreground" aria-hidden />
          Current
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-full border-2 border-dashed border-muted-foreground"
            aria-hidden
          />
          Best
        </li>
      </ul>
      <ChartContainer
        config={{}}
        className="aspect-auto h-64 w-full text-sm lg:text-xs"
        role="img"
        aria-label={`Median against chance of loss by ${slider.label}`}
      >
        <ScatterChart margin={{ left: 12, right: 52, top: 16, bottom: 12 }}>
          <CartesianGrid strokeOpacity={0.5} />
          <XAxis
            dataKey="loss"
            type="number"
            domain={[0, "auto"]}
            tickFormatter={(v: number) => formatPercent(v, 0)}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Chance of loss (less is better)",
              position: "insideBottom",
              offset: -8,
              fontSize: 12,
            }}
          />
          <YAxis
            dataKey="p50"
            type="number"
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={formatEuroCompact}
            tickLine={false}
            axisLine={false}
            width={72}
            label={{
              value: "Median final value (log)",
              angle: -90,
              position: "insideLeft",
              offset: -4,
              style: { textAnchor: "middle" },
              fontSize: 12,
            }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <PointTooltip
                  slider={slider}
                  p={payload[0]?.payload as SweepPoint}
                  invested={sweep.invested}
                />
              );
            }}
          />
          <Scatter
            data={rows}
            fill={color}
            line={{ stroke: color, strokeOpacity: 0.5, strokeWidth: 1.5 }}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number; payload?: SweepPoint }) => {
              const { cx = 0, cy = 0, payload } = props;
              if (!payload) return <g />;
              const isCurrent = payload.value === current;
              const isBest = payload.value === best?.value;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--card)" strokeWidth={2} />
                  {isCurrent && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={9}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth={2}
                    />
                  )}
                  {isBest && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 13 : 9}
                      fill="none"
                      stroke="var(--muted-foreground)"
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />
                  )}
                  {(highlight(payload) || payload === rows[0] || payload === rows.at(-1)) && (
                    <text x={cx + 12} y={cy + 4} fontSize={11} fill="var(--muted-foreground)">
                      {slider.format(payload.value)}
                    </text>
                  )}
                </g>
              );
            }}
          />
        </ScatterChart>
      </ChartContainer>
      <p className="mt-2 text-xs lg:text-[11px] text-muted-foreground">
        Up and to the left is better: more median for less risk. Where the line turns flat or bends
        right, extra risk no longer buys extra median.
      </p>
    </>
  );
}

/** Which value of a slider pays off for the selected scenario (REQ-008-01 – REQ-008-05). */
export function ValueExplorer({
  scenario,
  sweeps,
  pending,
  param,
  onParamChange,
  goal,
  onGoalChange,
  onApply,
  highlight,
  view,
  onViewChange,
}: Props) {
  const slider = EXPLORED[param];
  const sweep = sweeps[param];
  const color = scenarioColor(scenario);
  const params = scenario.params;
  // A slider that is hidden in the settings (no effect) is explored, but its value is not applied.
  const applicable = sweep ? Object.keys(sweep.assumed).length === 0 : false;
  const current = applicable ? params[param] : undefined;
  const best = sweep ? bestPoint(sweep.points, goal) : undefined;
  const note = sweep && assumptionNote(sweep);
  const updating = pending[param];
  return (
    <Card
      id="value-explorer"
      className={cn("scroll-mt-20 transition-shadow", highlight && "ring-4 ring-primary/40")}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Value explorer: which setting pays off? <UpdatingBadge updating={updating} />
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          “{params.name}” simulated for every value of one slider, all else unchanged, on the same
          paths (up to 500). Final value after taxes.
        </CardDescription>
        <CardAction>
          <Segmented
            label="Diagram"
            value={view}
            onChange={onViewChange}
            options={[
              { id: "distribution", label: "Distribution" },
              { id: "tradeoff", label: "Trade-off" },
            ]}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div role="tablist" aria-label="Explored slider" className="mb-3 flex flex-wrap gap-2">
          {SWEEP_PARAMS.map((p) => {
            const s = EXPLORED[p];
            const Icon = s.icon;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === param}
                onClick={() => onParamChange(p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  p === param
                    ? "border-foreground/40 bg-card shadow-sm"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden style={p === param ? { color } : undefined} />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm lg:text-xs text-muted-foreground">Optimise for</span>
          <Segmented
            label="Optimise for"
            value={goal}
            onChange={onGoalChange}
            options={GOALS.map((g) => ({ id: g.id, label: g.short, title: g.help }))}
          />
        </div>
        {!sweep ? (
          <p className="text-sm lg:text-xs text-muted-foreground">
            {updating ? "Analysing…" : "No data."}
          </p>
        ) : sweep.error ? (
          <p className="text-sm lg:text-xs text-amber-800 dark:text-amber-300">{sweep.error}</p>
        ) : (
          <Stale updating={updating}>
            {note && <p className="mb-2 text-sm lg:text-xs text-muted-foreground">{note}</p>}
            <Takeaway
              slider={slider}
              sweep={sweep}
              goal={goal}
              current={current}
              onApply={(v) => onApply(param, v)}
            />
            {view === "distribution" ? (
              <DistributionView
                slider={slider}
                sweep={sweep}
                color={color}
                current={current}
                best={best}
              />
            ) : (
              <TradeoffView
                slider={slider}
                sweep={sweep}
                color={color}
                current={current === undefined ? undefined : currentPoint(sweep, current)?.value}
                best={best}
              />
            )}
          </Stale>
        )}
      </CardContent>
    </Card>
  );
}
