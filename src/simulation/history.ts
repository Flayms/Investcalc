/** Splicing older gross return history onto net return series (used by `scripts/fetch-data.ts`). */

/**
 * Average monthly log gap between gross and net total returns (withholding tax on dividends), over
 * the months both series cover (aligned at index 0).
 */
export function grossNetGap(gross: number[], net: number[]): number {
  const n = Math.min(gross.length, net.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.log1p(gross[i] ?? 0) - Math.log1p(net[i] ?? 0);
  return sum / n;
}

/** Gross monthly returns reduced by a monthly log gap: an estimate of the net returns (REQ-012-02). */
export function netFromGross(gross: number[], gapPerMonth: number): number[] {
  return gross.map((g) => Math.expm1(Math.log1p(g) - gapPerMonth));
}
