/**
 * Downloads historical index data and writes compact monthly datasets to public/data/.
 * Run with `bun run data:fetch`. The generated JSON is committed so the site stays static.
 *
 * Sources:
 * - S&P 500: Robert Shiller's monthly data (via github.com/datasets/s-and-p-500), price + dividends.
 * - US total market: Kenneth French data library (CRSP value-weighted market, Mkt-RF + RF), daily.
 * - MSCI World / MSCI ACWI: MSCI daily net total return levels in USD from 2001; before that MSCI's
 *   monthly gross total return history (public repository NandayDev/MSCI-Historical-Data, pinned)
 *   reduced by the measured gross–net gap (REQ-012-02); variance from the daily returns of
 *   developed markets (French) from 1990-07, estimated before (REQ-012-03).
 * - Short rate (SOFR proxy): FRED TB3MS (3-month T-bill) from 1934, 1-month T-bill (French) from
 *   1926-07, before that Shiller's long interest rate.
 * - Euro (REQ-011): Deutsche Bundesbank daily DM per USD (Frankfurt fixing, until 1998) and ECB
 *   euro reference rate (from 1999), last quote of each month; euro short rate: OECD 3-month
 *   interbank rate for Germany (FRED IR3TIB01DEM156N).
 * - Inflation (REQ-013-02): US consumer prices from Shiller's CPI until 1946 and FRED CPIAUCSL from
 *   1947; German consumer prices from the OECD CPI (FRED DEUCPIALLMINMEI), after its last month the
 *   HICP (FRED CP0000DEM086NEST). Months without a value repeat the last known monthly change.
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
import type { CurrencyData, Dataset } from "../src/simulation/dataset";
import { grossNetGap, netFromGross } from "../src/simulation/history";

const SHILLER_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv";
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=TB3MS";
const FRENCH = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp";
const FRENCH_DAILY_URL = `${FRENCH}/F-F_Research_Data_Factors_daily_CSV.zip`;
const FRENCH_MONTHLY_URL = `${FRENCH}/F-F_Research_Data_Factors_CSV.zip`;
const FRENCH_DEVELOPED_DAILY_URL = `${FRENCH}/Developed_3_Factors_Daily_CSV.zip`;
/** MSCI end-of-day gross total return history (USD, monthly), pinned to a commit. */
const MSCI_HISTORY_COMMIT = "9c9d9373b0afddd88c3f2a768d6b86e3617b753f";
const msciHistoryUrl = (name: string) =>
  `https://raw.githubusercontent.com/NandayDev/MSCI-Historical-Data/${MSCI_HISTORY_COMMIT}/indexes_gross/MSCI%20${name}.csv`;
const BUNDESBANK = "https://api.statistiken.bundesbank.de/rest/data/BBEX3";
const DEM_PER_USD_URL = `${BUNDESBANK}/D.USD.DEM.AA.AC.000`;
const USD_PER_EUR_URL = `${BUNDESBANK}/D.USD.EUR.BB.AC.000`;
const fred = (id: string) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
const US_CPI_URL = fred("CPIAUCSL");
const DE_CPI_URL = fred("DEUCPIALLMINMEI");
const DE_HICP_URL = fred("CP0000DEM086NEST");
const EUR_RATE_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=IR3TIB01DEM156N";
/** Fixed conversion rate of the D-Mark to the euro. */
const DEM_PER_EUR = 1.95583;
/** First month of the euro short rate series. */
const EUR_START = "1960-01";
const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const msciUrl = (code: string) =>
  `https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=19970101&end_date=${today}&data_frequency=DAILY&index_codes=${code}`;

const run = promisify(execFile);

// curl instead of fetch(): Bun's fetch gets ECONNRESET from FRED behind some proxies.
async function text(url: string, accept?: string): Promise<string> {
  const headers = accept ? ["-H", `Accept: ${accept}`] : [];
  const { stdout } = await run("curl", ["-sfL", "--retry", "3", ...headers, url], {
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
    const [date = "", price, dividend, , cpi, longRate] = row.split(",");
    return {
      month: month(date),
      price: Number(price),
      dividend: Number(dividend),
      cpi: Number(cpi),
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

/** Bundesbank daily series (CSV) → last quote of each month, transformed by `f`. */
async function bundesbankMonthEnd(url: string, f: (v: number) => number) {
  const out = new Map<string, number>();
  for (const line of (await text(url, "text/csv")).split("\n")) {
    const cols = line.split(";");
    const date = cols[7] ?? "";
    const value = Number(cols[8]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(value > 0)) continue;
    out.set(month(date), f(value));
  }
  return out;
}

/** FRED monthly series (CSV) → value by month. */
async function fredMonthly(url: string): Promise<Map<string, number>> {
  const rows = (await text(url)).trim().split("\n").slice(1);
  const out = new Map<string, number>();
  for (const row of rows) {
    const [date = "", value] = row.split(",");
    const v = Number(value);
    if (Number.isFinite(v) && v > 0) out.set(month(date), v);
  }
  return out;
}

/** Price levels by month → monthly change by month (only where the previous month is known). */
function monthlyChange(levels: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [ym, level] of levels) {
    const prev = levels.get(previousMonth(ym));
    if (prev) out.set(ym, level / prev - 1);
  }
  return out;
}

/**
 * Monthly inflation for the given months from the first source that knows the month; months no
 * source knows repeat the last known value.
 */
function inflationSeries(months: string[], sources: Map<string, number>[]): number[] {
  let last = 0;
  return months.map((ym) => {
    const known = sources.map((s) => s.get(ym)).find((v) => v !== undefined);
    if (known !== undefined) last = known;
    return round(last);
  });
}

/** Euro per US dollar at the end of each month and the euro short rate (REQ-011-04). */
async function loadEuro(): Promise<CurrencyData> {
  const [dem, eur, rateCsv, deCpi, deHicp] = await Promise.all([
    bundesbankMonthEnd(DEM_PER_USD_URL, (v) => v / DEM_PER_EUR),
    bundesbankMonthEnd(USD_PER_EUR_URL, (v) => 1 / v),
    text(EUR_RATE_URL),
    fredMonthly(DE_CPI_URL),
    fredMonthly(DE_HICP_URL),
  ]);
  const eurPerUsd = new Map([...dem].filter(([ym]) => ym < "1999-01").concat([...eur]));
  const rates = new Map(
    rateCsv
      .trim()
      .split("\n")
      .slice(1)
      .map((row) => {
        const [date = "", value] = row.split(",");
        return [month(date), Number(value) / 100] as const;
      })
      .filter(([, v]) => Number.isFinite(v)),
  );
  const fx: number[] = [];
  const shortRates: number[] = [];
  const months: string[] = [];
  let lastRate = 0;
  for (let ym = EUR_START; ym < currentMonth && eurPerUsd.has(ym); ym = nextMonth(ym)) {
    const prev = eurPerUsd.get(previousMonth(ym));
    const cur = eurPerUsd.get(ym);
    if (prev === undefined || cur === undefined) throw new Error(`exchange rate missing: ${ym}`);
    fx.push(round(cur / prev - 1));
    months.push(ym);
    lastRate = rates.get(ym) ?? lastRate;
    shortRates.push(round(lastRate));
  }
  return {
    id: "eur",
    name: "Euro",
    source: `Exchange rate: Deutsche Bundesbank, DM per US dollar (Frankfurt fixing, converted at ${DEM_PER_EUR} DM per euro) until 1998, ECB euro reference rate from 1999; last quote of each month. Euro short rate: 3-month money market rate for Germany (OECD via FRED IR3TIB01DEM156N), latest months carried forward. German inflation: OECD consumer price index (FRED DEUCPIALLMINMEI), after its last month the HICP (FRED CP0000DEM086NEST).`,
    start: EUR_START,
    fx,
    rates: shortRates,
    inflation: inflationSeries(months, [monthlyChange(deCpi), monthlyChange(deHicp)]),
  };
}

function previousMonth(ym: string): string {
  const [y = 0, m = 0] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Monthly gross total returns by month from an MSCI history CSV ("YYYY-MM,level"). */
async function loadMsciHistory(name: string): Promise<Map<string, number>> {
  const rows = (await text(msciHistoryUrl(name)))
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => row.split(","))
    .map(([ym = "", level]) => ({ ym, level: Number(level) }));
  const out = new Map<string, number>();
  for (let i = 1; i < rows.length; i++) {
    const cur = rows[i];
    const prev = rows[i - 1];
    if (!cur || !prev) continue;
    if (cur.ym !== nextMonth(prev.ym)) throw new Error(`MSCI history gap before ${cur.ym}`);
    out.set(cur.ym, cur.level / prev.level - 1);
  }
  return out;
}

/** Realised variance of daily developed-market returns per month (French, from 1990-07). */
async function loadDevelopedVariance(): Promise<Map<string, number>> {
  const days = frenchRows(await unzipText(FRENCH_DEVELOPED_DAILY_URL), /^\d{8}$/).map((d) => ({
    month: d.ym,
    r: d.market,
  }));
  const series = monthlyFromDaily(days);
  return byMonth(series, series.variance);
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
  const [shiller, tbill, french, euro, developedVariance, usCpi] = await Promise.all([
    loadShiller(),
    loadTbill(),
    loadFrench(),
    loadEuro(),
    loadDevelopedVariance(),
    fredMonthly(US_CPI_URL),
  ]);
  // US inflation: CPIAUCSL from 1947, Shiller's CPI before (REQ-013-02).
  const usInflationSources = [
    monthlyChange(usCpi),
    monthlyChange(new Map(shiller.filter((r) => r.cpi > 0).map((r) => [r.month, r.cpi]))),
  ];
  const usInflation = (months: string[]) => inflationSeries(months, usInflationSources);
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
    inflation: usInflation(spMonths),
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
    inflation: usInflation(usMonths),
    variance: usMonths.map((ym) => roundVariance(french.variance.get(ym) ?? 0)),
    dailyFrom: french.start,
  };

  const msci = async (
    code: string,
    historyName: string,
    id: string,
    name: string,
    description: string,
  ) => {
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
    const recent = monthlyFromDaily(days);
    const recentMonths = [...byMonth(recent, recent.returns).keys()];

    // Gross history before the net series, reduced by the gross–net gap of the overlap (REQ-012-02).
    const history = await loadMsciHistory(historyName);
    const overlap = recentMonths.filter((ym) => history.has(ym));
    const gap = grossNetGap(
      overlap.map((ym) => history.get(ym) ?? 0),
      overlap.map((ym) => recent.returns[recentMonths.indexOf(ym)] ?? 0),
    );
    const olderMonths = [...history.keys()].filter((ym) => ym < recent.start);
    const older = netFromGross(
      olderMonths.map((ym) => history.get(ym) ?? 0),
      gap,
    );
    // Variance before 2001: developed-market daily data, else estimated (REQ-012-03).
    const scale = varianceScale(recent.returns, recent.variance);
    const olderVariance = olderMonths.map(
      (ym, i) => developedVariance.get(ym) ?? estimatedVariance(older[i] ?? 0, scale),
    );
    const months = [...olderMonths, ...recentMonths];
    const dailyFrom = olderMonths.find((ym) => developedVariance.has(ym)) ?? recent.start;
    console.log(
      `${id}: gross–net gap ${((Math.exp(gap * 12) - 1) * 100).toFixed(2)} % p.a., variance scale ${scale.toFixed(3)}`,
    );
    return {
      id,
      name,
      description,
      source: `MSCI index ${code}, USD. From ${recent.start}: net total return, daily levels (msci.com), month = last level of the month. ${olderMonths[0]} – ${olderMonths.at(-1)}: MSCI gross total return (monthly, via github.com/NandayDev/MSCI-Historical-Data) minus the gross–net gap of later years (${((Math.exp(gap * 12) - 1) * 100).toFixed(2)} % p.a.); variance from daily developed-market returns (Kenneth French) from ${dailyFrom}, estimated before.`,
      currency: "USD",
      priceType: "close",
      start: months[0] ?? recent.start,
      returns: [...older, ...recent.returns].map((r) => round(r)),
      rates: months.map((ym) => round(shortRate(ym, 0))),
      inflation: usInflation(months),
      variance: [...olderVariance, ...recent.variance].map(roundVariance),
      dailyFrom,
    } satisfies Dataset;
  };

  const datasets = [
    sp500,
    usMarket,
    await msci(
      "990100",
      "WORLD",
      "msci-world",
      "MSCI World",
      "~1,400 large and mid caps in 23 developed countries. No emerging markets.",
    ),
    await msci(
      "892400",
      "ACWI",
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
  await writeFile("public/data/eur.json", `${JSON.stringify(euro)}\n`);
  console.log(`eur: ${euro.start}, ${euro.fx.length} months`);
  console.log(`S&P 500 variance scale for months without daily data: ${scale.toFixed(3)}`);
  await writeFile(
    "public/data/index.json",
    `${JSON.stringify(datasets.map(({ id, name }) => ({ id, name })))}\n`,
  );
}

await main();
