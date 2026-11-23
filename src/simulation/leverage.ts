export type MonthMarket = {
  /** Total return of the index in this month. */
  r: number;
  /** Annualised short rate (SOFR proxy). */
  rate: number;
  /** Realised variance of the month's daily log returns (sum of squares). */
  variance: number;
};

export type FundCosts = {
  leverage: number;
  /** Annual total expense ratio. */
  ter: number;
  includeSofr: boolean;
  /** Annual financing spread over SOFR charged on the borrowed part. */
  financingSpread: number;
};

/**
 * Monthly return of a daily-reset leveraged ETF.
 * Continuous-time result: ln(P_t/P_0) = L·ln(S_t/S_0) − (L²−L)/2·σ²t − (L−1)·r_f·t − TER·t.
 * The σ² term is the volatility drag; it is zero for L = 1.
 * For a part of a month (REQ-015-02), `m` holds the return and variance of the days held and
 * `fraction` is their share of the month's trading days; TER and financing are charged pro rata.
 */
export function leveragedReturn(m: MonthMarket, c: FundCosts, fraction = 1): number {
  const L = c.leverage;
  const x = Math.log1p(m.r);
  const financingRate = (c.includeSofr ? m.rate : 0) + c.financingSpread;
  const costs = (((L - 1) * financingRate) / 12 + c.ter / 12) * fraction;
  const log = L * x - ((L * L - L) / 2) * m.variance - costs;
  return Math.expm1(log);
}
