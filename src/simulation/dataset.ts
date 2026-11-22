import { z } from "zod";

export const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.string(),
  currency: z.literal("USD"),
  /** "average": monthly average prices (Shiller), "close": end-of-month levels. */
  priceType: z.enum(["average", "close"]),
  start: z.string().regex(/^\d{4}-\d{2}$/),
  returns: z.array(z.number()),
  rates: z.array(z.number()),
});

export type Dataset = z.infer<typeof datasetSchema>;

export const datasetIds = ["sp500", "msci-world", "msci-acwi"] as const;
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
