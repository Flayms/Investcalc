import {
  type CurrencyData,
  type DailyData,
  type Dataset,
  getDataset,
  monthIndex,
  monthLabel,
} from "@/simulation/dataset";
import type { ScenarioParams } from "@/simulation/params";

/**
 * The currency change on each trading day of a month (REQ-015-05): each day uses the last fixing on
 * or before it, the month's last trading day its last fixing, so the days compound to the month's
 * change. `fixingChanges` are relative to the previous fixing (the first to last month's last).
 */
export function dailyFx(tradingDays: number[], fixingDays: number[], fixingChanges: number[]) {
  const out: number[] = [];
  let level = 1;
  let previous = 1;
  let k = 0;
  tradingDays.forEach((day, j) => {
    const last = j === tradingDays.length - 1;
    while (k < fixingDays.length && (last || (fixingDays[k] ?? 0) <= day)) {
      level *= 1 + (fixingChanges[k] ?? 0);
      k++;
    }
    out.push(level / previous - 1);
    previous = level;
  });
  return out;
}

/** The daily block for the months `from` … `to` − 1 of the dataset, in the target currency. */
function dailyInCurrency(dataset: Dataset, eur: CurrencyData, from: number, to: number) {
  const daily = dataset.daily;
  if (!daily) return undefined;
  const start = monthIndex(dataset.start);
  const eurStart = monthIndex(eur.start);
  // Offsets of each month in the flat arrays.
  const offsets = (counts: number[]) => {
    const out = [0];
    for (const c of counts) out.push((out.at(-1) ?? 0) + c);
    return out;
  };
  const dayAt = offsets(daily.days);
  const fixingAt = eur.daily ? offsets(eur.daily.days) : [];
  const out: DailyData = { from: "", days: [], dayOfMonth: [], returns: [], fx: [] };
  for (let i = from; i < to; i++) {
    const k = start + i - monthIndex(daily.from);
    if (k < 0 || k >= daily.days.length) continue;
    if (!out.from) out.from = monthLabel(dataset, i);
    const days = daily.dayOfMonth.slice(dayAt[k], dayAt[k + 1]);
    out.days.push(days.length);
    out.dayOfMonth.push(...days);
    out.returns.push(...daily.returns.slice(dayAt[k], dayAt[k + 1]));
    const e = start + i - eurStart;
    const fixings = eur.daily?.dayOfMonth.slice(fixingAt[e], fixingAt[e + 1]) ?? [];
    const changes = eur.daily?.fx.slice(fixingAt[e], fixingAt[e + 1]) ?? [];
    // Without daily fixings the month's change falls on its last trading day.
    const fx = fixings.length > 0 ? dailyFx(days, fixings, changes) : days.map(() => 0);
    if (fixings.length === 0 && fx.length > 0) fx[fx.length - 1] = eur.fx[e] ?? 0;
    out.fx?.push(...fx);
  }
  return out.days.length > 0 ? out : undefined;
}

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
    daily: dailyInCurrency(dataset, eur, from, to),
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
