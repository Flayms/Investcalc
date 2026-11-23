import { ChartSplineIcon } from "lucide-react";
import { type ExploredSlider, GOALS, goalValue } from "@/features/explorer/explored";
import { formatEuro, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bestPoint, type Goal, type ParameterSweep } from "@/simulation/sweep";

type Props = {
  slider: ExploredSlider;
  sweep?: ParameterSweep;
  goal: Goal;
  updating: boolean;
  /** Current slider value. */
  value: number;
  color: string;
  onApply: (value: number) => void;
  onExplore: () => void;
};

const W = 100;
const H = 28;

/**
 * A small chart directly under an explored slider. Its x axis is exactly the slider's range (the
 * padding matches half the slider thumb), so the curve sits under the thumb (REQ-008-05).
 */
export function SliderInsight({
  slider,
  sweep,
  goal,
  updating,
  value,
  color,
  onApply,
  onExplore,
}: Props) {
  const Icon = slider.icon;
  const goalInfo = GOALS.find((g) => g.id === goal);
  const points = sweep && !sweep.error ? sweep.points : [];
  const best = bestPoint(points, goal);
  const ys = points.map((p) =>
    // Euro goals on a log scale, like the explorer; chance of loss linear.
    goal === "loss" ? goalValue(goal, p) : Math.log(Math.max(goalValue(goal, p), 1)),
  );
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (v: number) => ((v - slider.min) / (slider.max - slider.min)) * W;
  const y = (v: number) => (hi === lo ? H / 2 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6));
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.value)},${y(ys[i] ?? 0)}`).join(" ");
  const area = points.length ? `${line} L${W},${H} L0,${H} Z` : "";
  const bestIndex = best ? points.indexOf(best) : -1;
  const isBest = best !== undefined && Math.abs(best.value - value) < 1e-9;
  const metric = (v: number) => (goal === "loss" ? formatPercent(v, 0) : formatEuro(v));

  return (
    <div className="space-y-1" data-testid={`insight-${slider.param}`}>
      <div className="relative mx-3 h-7 lg:mx-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={cn(
            "absolute inset-0 size-full overflow-visible transition-opacity",
            updating && "opacity-40",
          )}
          role="img"
          aria-label={
            best
              ? `${goalInfo?.short} by ${slider.label}; best at ${slider.format(best.value)}`
              : `${goalInfo?.short} by ${slider.label}: calculating`
          }
        >
          {points.length > 0 && (
            <>
              <path d={area} fill={color} fillOpacity={0.12} />
              <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              {best && (
                <line
                  x1={x(best.value)}
                  x2={x(best.value)}
                  y1={0}
                  y2={H}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <line
                x1={x(value)}
                x2={x(value)}
                y1={0}
                y2={H}
                stroke="var(--foreground)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>
        {/* Outside the stretched SVG so it stays round. */}
        {best && bestIndex >= 0 && (
          <span
            className={cn(
              "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card transition-opacity",
              updating && "opacity-40",
            )}
            style={{
              left: `${x(best.value)}%`,
              top: `${(y(ys[bestIndex] ?? 0) / H) * 100}%`,
              background: color,
            }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs lg:text-[11px] text-muted-foreground">
        <Icon className="size-3.5 shrink-0" style={{ color }} aria-hidden />
        <span>
          {goalInfo?.short} by value
          {best && (
            <>
              {" · "}
              <span className="font-medium text-foreground">best {slider.format(best.value)}</span>{" "}
              ({metric(goalValue(goal, best))})
            </>
          )}
          {!best && updating && " · calculating…"}
        </span>
        <span className="ml-auto flex gap-1">
          {best && !isBest && (
            <button
              type="button"
              onClick={() => onApply(best.value)}
              className="rounded border px-1.5 py-0.5 font-medium text-foreground hover:bg-muted"
            >
              Use {slider.format(best.value)}
            </button>
          )}
          <button
            type="button"
            onClick={onExplore}
            aria-label={`Explore ${slider.label}`}
            title="Open this slider's diagram in the value explorer"
            className="flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium text-foreground hover:bg-muted"
          >
            <ChartSplineIcon className="size-3.5" aria-hidden /> Explore
          </button>
        </span>
      </div>
    </div>
  );
}
