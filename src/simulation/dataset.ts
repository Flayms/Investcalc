import { z } from "zod";

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);

/** Trading days of the months that have them, as flat arrays (REQ-015-04). */
export const dailySchema = z.object({
  /** "YYYY-MM" of the first month with daily data; the following months are contiguous. */
  from: yearMonth,
  /** Number of trading days of each month from `from` on. */
  days: z.array(z.number().int().min(1)),
  /** Day of the month of each trading day. */
  dayOfMonth: z.array(z.number().int().min(1).max(31)),
  /** Simple return of the index on each trading day; a month's days compound to its return. */
  returns: z.array(z.number()),
  /** Converted datasets only: change of the dollar's value in the target currency on each day. */
  fx: z.array(z.number()).optional(),
});

export type DailyData = z.infer<typeof dailySchema>;

export const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.string(),
  /** Currency of `returns`. "EUR" only for datasets converted with `inCurrency`. */
  currency: z.enum(["USD", "EUR"]),
  /** "average": monthly average prices (Shiller), "close": end-of-month levels. */
  priceType: z.enum(["average", "close"]),
  start: z.string().regex(/^\d{4}-\d{2}$/),
  returns: z.array(z.number()),
  rates: z.array(z.number()),
  /** Monthly change of consumer prices in the dataset's currency (US CPI). */
  inflation: z.array(z.number()),
  /** Realised variance of daily log returns per month (sum of squares, not annualised). */
  variance: z.array(z.number()),
  /** "YYYY-MM" of the first month whose variance comes from daily data; earlier months are estimated. */
  dailyFrom: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  /** Converted datasets only: monthly change of the dollar's value in the target currency. */
  fx: z.array(z.number()).optional(),
  /** Converted datasets only: annualised short rate earned on cash in the target currency. */
  cashRates: z.array(z.number()).optional(),
  /** Daily index returns for the SMA signal; absent for indices without daily data (REQ-015-04). */
  daily: dailySchema.optional(),
});

export type Dataset = z.infer<typeof datasetSchema>;

/** Exchange rate and short rate of the euro, used to convert the USD datasets (REQ-011-01). */
export const currencySchema = z.object({
  id: z.literal("eur"),
  name: z.string(),
  source: z.string(),
  /** "YYYY-MM" of the first month. */
  start: z.string().regex(/^\d{4}-\d{2}$/),
  /** Monthly change of the value of one US dollar in euros (month-end rates). */
  fx: z.array(z.number()),
  /** Annualised euro short rate (German 3-month money market rate). */
  rates: z.array(z.number()),
  /** Monthly change of German consumer prices. */
  inflation: z.array(z.number()),
  /** Daily fixings from `start` on: count per month, day of month and change of the dollar's value. */
  daily: z
    .object({
      days: z.array(z.number().int().min(0)),
      dayOfMonth: z.array(z.number().int().min(1).max(31)),
      fx: z.array(z.number()),
    })
    .optional(),
});

export type CurrencyData = z.infer<typeof currencySchema>;

export const datasetIds = ["sp500", "us-market", "msci-world", "msci-acwi"] as const;
export type DatasetId = (typeof datasetIds)[number];

/** Months since year 0 of a "YYYY-MM" label. */
export const monthIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

/** Daily returns (and currency changes) of one month, as views on the dataset's arrays. */
export type MonthDays = {
  r: Float64Array;
  fx?: Float64Array;
  /** Growth of the index level in the dataset's currency on each day: (1 + r)·(1 + fx). */
  growth: Float64Array;
};

/** The days of a month from their returns (tests and `monthDays`). */
export function toMonthDays(r: Float64Array, fx?: Float64Array): MonthDays {
  const growth = new Float64Array(r.length);
  for (let j = 0; j < r.length; j++) growth[j] = (1 + (r[j] ?? 0)) * (1 + (fx?.[j] ?? 0));
  return { r, fx, growth };
}

/** The trading days of each month of the dataset; undefined for months without daily data. */
export function monthDays(dataset: Dataset): (MonthDays | undefined)[] {
  const out: (MonthDays | undefined)[] = new Array(dataset.returns.length).fill(undefined);
  const daily = dataset.daily;
  if (!daily) return out;
  const r = Float64Array.from(daily.returns);
  const fx = daily.fx ? Float64Array.from(daily.fx) : undefined;
  const growth = toMonthDays(r, fx).growth;
  const offset = monthIndex(daily.from) - monthIndex(dataset.start);
  let at = 0;
  daily.days.forEach((count, k) => {
    const i = offset + k;
    if (i >= 0 && i < out.length && count > 0) {
      out[i] = {
        r: r.subarray(at, at + count),
        fx: fx?.subarray(at, at + count),
        growth: growth.subarray(at, at + count),
      };
    }
    at += count;
  });
  return out;
}

/** "YYYY-MM" of the month with the given index. */
export function monthLabel(dataset: Pick<Dataset, "start">, index: number): string {
  const total =
    Number(dataset.start.slice(0, 4)) * 12 + Number(dataset.start.slice(5, 7)) - 1 + index;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function getDataset(datasets: Record<string, Dataset>, id: string): Dataset {
  const d = datasets[id];
  if (!d) throw new Error(`Unknown dataset ${id}`);
  return d;
}

export function firstYear(dataset: Dataset): number {
  return Number(dataset.start.slice(0, 4));
}

export function lastYear(dataset: Dataset): number {
  return Number(monthLabel(dataset, dataset.returns.length - 1).slice(0, 4));
}

/** Annualised growth and volatility of the whole history. */
export function datasetStats(dataset: Dataset) {
  const logs = dataset.returns.map((r) => Math.log1p(r));
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const simple = dataset.returns.reduce((a, b) => a + b, 0) / logs.length;
  const variance = dataset.returns.reduce((a, r) => a + (r - simple) ** 2, 0) / logs.length;
  return {
    cagr: Math.expm1(mean * 12),
    volatility: Math.sqrt(variance * 12),
    months: logs.length,
    from: dataset.start,
    to: monthLabel(dataset, dataset.returns.length - 1),
  };
}
