/**
 * Downloads historical index data and writes compact monthly datasets to public/data/.
 * Run with `bun run data:fetch`. The generated JSON is committed so the site stays static.
 *
 * Sources:
 * - S&P 500: Robert Shiller's monthly data (via github.com/datasets/s-and-p-500), price + dividends.
 * - US total market: Kenneth French data library (CRSP value-weighted market, Mkt-RF + RF), daily.
 * - MSCI World / MSCI ACWI: MSCI daily net total return levels in USD.
 * - Short rate (SOFR proxy): FRED TB3MS (3-month T-bill) from 1934, 1-month T-bill (French) from
 *   1926-07, before that Shiller's long interest rate.
 * - Variance per month (volatility drag): realised variance of daily log returns. The S&P 500 uses
 *   the US total market's daily data; months without daily data are estimated (see daily.ts).
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  type DailyReturn,
  estimatedVariance,
  type MonthlySeries,
  monthlyFromDaily,
  nextMonth,
  varianceScale,
} from "../src/simulation/daily";
import type { Dataset } from "../src/simulation/dataset";

const SHILLER_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv";
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=TB3MS";
const FRENCH = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp";
const FRENCH_DAILY_URL = `${FRENCH}/F-F_Research_Data_Factors_daily_CSV.zip`;
const FRENCH_MONTHLY_URL = `${FRENCH}/F-F_Research_Data_Factors_CSV.zip`;
const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const msciUrl = (code: string) =>
  `https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=19970101&end_date=${today}&data_frequency=DAILY&index_codes=${code}`;

const run = promisify(execFile);

// curl instead of fetch(): Bun's fetch gets ECONNRESET from FRED behind some proxies.
async function text(url: string): Promise<string> {
  const { stdout } = await run("curl", ["-sfL", "--retry", "3", url], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

async function unzipText(url: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "investcalc-"));
  const file = join(dir, "data.zip");
  await run("curl", ["-sfL", "--retry", "3", "-o", file, url]);
  const { stdout } = await run("unzip", ["-p", file], { maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

const round = (x: number, digits = 6) => Number(x.toFixed(digits));
/** Variances are small (1e-4 … 1e-1); keep significant digits. */
const roundVariance = (x: number) => Number(x.toPrecision(4));
const month = (date: string) => date.slice(0, 7);
const currentMonth = new Date().toISOString().slice(0, 7);

async function loadShiller() {
  const rows = (await text(SHILLER_URL)).trim().split("\n").slice(1);
  return rows.map((row) => {
    const [date = "", price, dividend, , , longRate] = row.split(",");
    return {
      month: month(date),
      price: Number(price),
      dividend: Number(dividend),
      longRate: Number(longRate) / 100,
    };
  });
}

async function loadTbill(): Promise<Map<string, number>> {
  const rows = (await text(FRED_URL)).trim().split("\n").slice(1);
  return new Map(
    rows.map((row) => {
      const [date = "", value] = row.split(",");
      return [month(date), Number(value) / 100];
    }),
  );
}

type French = {
  start: string;
  /** Monthly total return of the US market (Mkt-RF + RF). */
  returns: number[];
  /** Annualised 1-month T-bill rate per month. */
  tbill1m: Map<string, number>;
  /** Realised variance of the daily market returns per month. */
  variance: Map<string, number>;
};

/** Rows "date, Mkt-RF, SMB, HML, RF" (in %) whose date matches `pattern`. */
function frenchRows(csv: string, pattern: RegExp) {
  return csv.split("\n").flatMap((line) => {
    const [date = "", mktRf, , , rf] = line.split(",").map((s) => s.trim());
    if (!pattern.test(date)) return [];
    const ym = `${date.slice(0, 4)}-${date.slice(4, 6)}`;
    return [{ ym, market: (Number(mktRf) + Number(rf)) / 100, rf: Number(rf) / 100 }];
  });
}

/**
 * US market and 1-month T-bill from the French library. Returns and rates come from the monthly file
 * (the daily file rounds the T-bill to 0.01 % a day); the daily file only provides the variance.
 */
async function loadFrench(): Promise<French> {
  const [daily, monthly] = await Promise.all([
    unzipText(FRENCH_DAILY_URL),
    unzipText(FRENCH_MONTHLY_URL),
  ]);
  const days = frenchRows(daily, /^\d{8}$/).map((d) => ({ month: d.ym, r: d.market }));
  const dailySeries = monthlyFromDaily(days);
  const months = frenchRows(monthly, /^\d{6}$/);
  const variance = byMonth(dailySeries, dailySeries.variance);
  const missing = months.find((m) => !variance.has(m.ym));
  if (missing) throw new Error(`no daily data for ${missing.ym}`);
  return {
    start: months[0]?.ym ?? "",
    returns: months.map((m) => m.market),
    tbill1m: new Map(months.map((m) => [m.ym, m.rf * 12])),
    variance,
  };
}

/** Month label → value of a monthly series. */
function byMonth(series: MonthlySeries, values: number[]): Map<string, number> {
  const out = new Map<string, number>();
  let ym = series.start;
  for (const v of values) {
    out.set(ym, v);
    ym = nextMonth(ym);
  }
  return out;
}

async function main() {
  const [shiller, tbill, french] = await Promise.all([loadShiller(), loadTbill(), loadFrench()]);
  const lastTbill = [...tbill.values()].at(-1) ?? 0;
  const firstTbillMonth = [...tbill.keys()][0] ?? "";
  const dailyVariance = french.variance;
  const shortRate = (ym: string, beforeTbill: number) =>
    tbill.get(ym) ?? french.tbill1m.get(ym) ?? (ym < firstTbillMonth ? beforeTbill : lastTbill);

  // S&P 500 total return: r_t = (P_{t+1} + D_t / 12) / P_t − 1 (Shiller convention).
  // Dividends are missing at the end of the dataset → carry the last known dividend yield forward.
  let lastYield = 0;
  const spMonths: string[] = [];
  const spReturns: number[] = [];
  const spRates: number[] = [];
  for (let i = 0; i < shiller.length - 1; i++) {
    const cur = shiller[i];
    const next = shiller[i + 1];
    if (!cur || !next) continue;
    if (cur.dividend > 0) lastYield = cur.dividend / cur.price;
    const dividend = cur.dividend > 0 ? cur.dividend : cur.price * lastYield;
    spMonths.push(cur.month);
    spReturns.push(round((next.price + dividend / 12) / cur.price - 1));
    spRates.push(round(shortRate(cur.month, cur.longRate)));
  }
  // Months with daily data calibrate the estimate for the months without (REQ-010-02).
  const overlap = spMonths.flatMap((ym, i) => {
    const v = dailyVariance.get(ym);
    return v === undefined ? [] : [{ r: spReturns[i] ?? 0, v }];
  });
  const scale = varianceScale(
    overlap.map((o) => o.r),
    overlap.map((o) => o.v),
  );
  const spVariance = spMonths.map((ym, i) =>
    roundVariance(dailyVariance.get(ym) ?? estimatedVariance(spReturns[i] ?? 0, scale)),
  );
  const sp500: Dataset = {
    id: "sp500",
    name: "S&P 500",
    description: "500 large US companies. Longest history (since 1871).",
    source: `Robert Shiller, monthly averages of price + dividends (datasets/s-and-p-500). Dividends after mid-2023 extrapolated from the last known yield. Daily variance of the US total market (Kenneth French) from ${french.start}; earlier and newer months estimated (×${scale.toFixed(2)} squared monthly return).`,
    currency: "USD",
    priceType: "average",
    start: spMonths[0] ?? "",
    returns: spReturns,
    rates: spRates,
    variance: spVariance,
    dailyFrom: french.start,
  };

  const usMonths = [...french.tbill1m.keys()];
  const usMarket: Dataset = {
    id: "us-market",
    name: "US total market",
    description:
      "All listed US stocks, value weighted (~4,000 companies, like a total market ETF). Month-end data since 1926.",
    source:
      "Kenneth French data library (CRSP value-weighted market, Mkt-RF + RF), monthly total returns; variance from daily returns.",
    currency: "USD",
    priceType: "close",
    start: french.start,
    returns: french.returns.map((r) => round(r)),
    rates: usMonths.map((ym) => round(shortRate(ym, 0))),
    variance: usMonths.map((ym) => roundVariance(french.variance.get(ym) ?? 0)),
    dailyFrom: french.start,
  };

  const msci = async (code: string, id: string, name: string, description: string) => {
    const json = JSON.parse(await text(msciUrl(code)));
    const levels: { level_eod: number; calc_date: number }[] = json.indexes.INDEX_LEVELS;
    const days: DailyReturn[] = [];
    for (let i = 1; i < levels.length; i++) {
      const cur = levels[i];
      const prev = levels[i - 1];
      if (!cur || !prev) continue;
      const date = String(cur.calc_date);
      const ym = `${date.slice(0, 4)}-${date.slice(4, 6)}`;
      if (ym === currentMonth) break; // incomplete month
      days.push({ month: ym, r: cur.level_eod / prev.level_eod - 1 });
    }
    const series = monthlyFromDaily(days);
    const months = [...byMonth(series, series.returns).keys()];
    return {
      id,
      name,
      description,
      source: `MSCI index ${code}, net total return, USD, daily levels (msci.com); month = last level of the month.`,
      currency: "USD",
      priceType: "close",
      start: series.start,
      returns: series.returns.map((r) => round(r)),
      rates: months.map((ym) => round(shortRate(ym, 0))),
      variance: series.variance.map(roundVariance),
      dailyFrom: series.start,
    } satisfies Dataset;
  };

  const datasets = [
    sp500,
    usMarket,
    await msci(
      "990100",
      "msci-world",
      "MSCI World",
      "~1,400 large and mid caps in 23 developed countries. No emerging markets.",
    ),
    await msci(
      "892400",
      "msci-acwi",
      "MSCI ACWI (All World)",
      "MSCI World plus ~24 emerging markets (~2,500 stocks). Comparable to FTSE All-World.",
    ),
  ];

  await mkdir("public/data", { recursive: true });
  for (const d of datasets) {
    await writeFile(`public/data/${d.id}.json`, `${JSON.stringify(d)}\n`);
    console.log(`${d.id}: ${d.start}, ${d.returns.length} months`);
  }
  console.log(`S&P 500 variance scale for months without daily data: ${scale.toFixed(3)}`);
  await writeFile(
    "public/data/index.json",
    `${JSON.stringify(datasets.map(({ id, name }) => ({ id, name })))}\n`,
  );
}

await main();
