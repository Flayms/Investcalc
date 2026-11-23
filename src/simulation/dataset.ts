import { z } from "zod";

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
});

export type CurrencyData = z.infer<typeof currencySchema>;

export const datasetIds = ["sp500", "us-market", "msci-world", "msci-acwi"] as const;
export type DatasetId = (typeof datasetIds)[number];

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
