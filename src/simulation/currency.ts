import { type CurrencyData, type Dataset, getDataset } from "@/simulation/dataset";
import type { ScenarioParams } from "@/simulation/params";

const monthIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

/**
 * The dataset as seen by a euro investor: only the months covered by both (REQ-011-04), with the
 * exchange rate change, the euro short rate and German inflation of each month (REQ-013-02). Returns, rates and variance
 * stay in US dollars: leverage and financing apply to them, the currency effect once (REQ-011-02).
 */
export function inCurrency(dataset: Dataset, eur: CurrencyData): Dataset {
  const offset = monthIndex(eur.start) - monthIndex(dataset.start);
  const from = Math.max(0, offset);
  const to = Math.min(dataset.returns.length, offset + eur.fx.length);
  const fx = (i: number) => eur.fx[i - offset] ?? 0;
  const indices = Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
  const startIndex = monthIndex(dataset.start) + from;
  return {
    ...dataset,
    currency: "EUR",
    start: `${Math.floor(startIndex / 12)}-${String((startIndex % 12) + 1).padStart(2, "0")}`,
    returns: dataset.returns.slice(from, to),
    rates: dataset.rates.slice(from, to),
    variance: dataset.variance.slice(from, to),
    fx: indices.map(fx),
    cashRates: indices.map((i) => eur.rates[i - offset] ?? 0),
    inflation: indices.map((i) => eur.inflation[i - offset] ?? 0),
  };
}

/** Everything needed to simulate a scenario in either currency. */
export type SimulationData = { datasets: Record<string, Dataset>; eur: CurrencyData };

/** The scenario's index in the scenario's currency (REQ-011-01). */
export function datasetFor(
  data: SimulationData,
  params: Pick<ScenarioParams, "etfId" | "currency">,
): Dataset {
  const dataset = getDataset(data.datasets, params.etfId);
  return params.currency === "EUR" ? inCurrency(dataset, data.eur) : dataset;
}
