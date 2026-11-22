/** Percentile of an ascending sorted array with linear interpolation, q in [0, 1]. */
export function percentile(sorted: ArrayLike<number>, q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo] as number;
  const b = sorted[hi] as number;
  return a + (b - a) * (pos - lo);
}

export function median(values: number[]): number {
  return percentile(
    [...values].sort((a, b) => a - b),
    0.5,
  );
}
