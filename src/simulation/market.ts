import { type Dataset, monthLabel } from "@/simulation/dataset";

export type MarketPhase = "bull" | "correction" | "bear";

export type MarketStatus = {
  lastMonth: string;
  phase: MarketPhase;
  /** Drop from the all-time high (≤ 0). */
  drawdown: number;
  smas: { months: number; value: number; above: boolean; distance: number }[];
  /** Total return index level (start = 1). */
  level: number;
};

export const SMA_WINDOWS = [6, 10, 12] as const;

export function marketStatus(dataset: Dataset): MarketStatus {
  const levels: number[] = [];
  let level = 1;
  let high = 1;
  for (const r of dataset.returns) {
    level *= 1 + r;
    high = Math.max(high, level);
    levels.push(level);
  }
  const drawdown = level / high - 1;
  const smas = SMA_WINDOWS.map((months) => {
    const window = levels.slice(-months);
    const value = window.reduce((a, b) => a + b, 0) / window.length;
    return { months, value, above: level >= value, distance: level / value - 1 };
  });
  const phase: MarketPhase = drawdown <= -0.2 ? "bear" : drawdown <= -0.1 ? "correction" : "bull";
  return {
    lastMonth: monthLabel(dataset, dataset.returns.length - 1),
    phase,
    drawdown,
    smas,
    level,
  };
}
