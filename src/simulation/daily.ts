/** Daily index returns → monthly returns and realised variances (used by `scripts/fetch-data.ts`). */

export type DailyReturn = {
  /** "YYYY-MM" of the trading day. */
  month: string;
  /** Simple return of the day (0.01 = +1 %). */
  r: number;
};

export type MonthlySeries = {
  /** "YYYY-MM" of the first month. */
  start: string;
  /** Monthly return: the month's daily returns compounded. */
  returns: number[];
  /** Realised variance of the month: sum of squared daily log returns. */
  variance: number[];
};

/** A trading day with its date. */
export type DatedReturn = DailyReturn & { /** Day of the month. */ day: number };

/**
 * Daily returns packed per month (REQ-015-04). With `monthReturn`, each month's days are shifted by
 * the same log amount so that they compound to that month's return, keeping the shape of the month.
 */
export function dailyBlock(
  days: DatedReturn[],
  monthReturn: (ym: string) => number | undefined = () => undefined,
) {
  const first = days[0];
  if (!first) throw new Error("no daily returns");
  const block = {
    from: first.month,
    days: [] as number[],
    dayOfMonth: [] as number[],
    returns: [] as number[],
  };
  let month = first.month;
  let chunk: DatedReturn[] = [];
  const close = () => {
    const target = monthReturn(month);
    const log = chunk.reduce((a, d) => a + Math.log1p(d.r), 0);
    const shift = target === undefined ? 0 : (Math.log1p(target) - log) / chunk.length;
    block.days.push(chunk.length);
    for (const d of chunk) {
      block.dayOfMonth.push(d.day);
      block.returns.push(shift === 0 ? d.r : Math.expm1(Math.log1p(d.r) + shift));
    }
  };
  for (const day of days) {
    if (day.month !== month) {
      close();
      const expected = nextMonth(month);
      if (day.month !== expected) throw new Error(`daily data missing for ${expected}`);
      month = day.month;
      chunk = [];
    }
    chunk.push(day);
  }
  close();
  return block;
}

export function nextMonth(ym: string): string {
  const [y = 0, m = 0] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Groups consecutive daily returns by month. Days must be sorted and months contiguous. */
export function monthlyFromDaily(days: DailyReturn[]): MonthlySeries {
  const first = days[0];
  if (!first) throw new Error("no daily returns");
  const series: MonthlySeries = { start: first.month, returns: [], variance: [] };
  let month = first.month;
  let log = 0;
  let variance = 0;
  const close = () => {
    series.returns.push(Math.expm1(log));
    series.variance.push(variance);
  };
  for (const day of days) {
    if (day.month !== month) {
      close();
      const expected = nextMonth(month);
      if (day.month !== expected) throw new Error(`daily data missing for ${expected}`);
      month = day.month;
      log = 0;
      variance = 0;
    }
    const x = Math.log1p(day.r);
    log += x;
    variance += x * x;
  }
  close();
  return series;
}

/**
 * Scale for months without daily data: ratio of the realised daily variance to the squared monthly
 * log returns over months where both are known.
 */
export function varianceScale(monthlyReturns: number[], realised: number[]): number {
  let squared = 0;
  let total = 0;
  monthlyReturns.forEach((r, i) => {
    squared += Math.log1p(r) ** 2;
    total += realised[i] ?? 0;
  });
  return squared > 0 ? total / squared : 1;
}

/** Variance estimate for a month without daily data. */
export function estimatedVariance(monthlyReturn: number, scale: number): number {
  return scale * Math.log1p(monthlyReturn) ** 2;
}
