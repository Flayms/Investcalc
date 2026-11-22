/**
 * Downloads historical index data and writes compact monthly datasets to public/data/.
 * Run with `bun run data:fetch`. The generated JSON is committed so the site stays static.
 *
 * Sources:
 * - S&P 500: Robert Shiller's monthly data (via github.com/datasets/s-and-p-500), price + dividends.
 * - MSCI World / MSCI ACWI: MSCI end-of-month net total return levels in USD.
 * - Short rate (SOFR proxy): FRED TB3MS (3-month T-bill), before 1934 Shiller's long interest rate.
 */
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

type Dataset = {
  id: string;
  name: string;
  description: string;
  source: string;
  currency: "USD";
  priceType: "average" | "close";
  start: string; // YYYY-MM of the first return
  returns: number[]; // monthly total returns (0.01 = +1 %)
  rates: number[]; // annualised short rate for the same month (0.05 = 5 %)
};

const SHILLER_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv";
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=TB3MS";
const msciUrl = (code: string) =>
  `https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=19970101&end_date=${new Date().toISOString().slice(0, 10).replaceAll("-", "")}&data_frequency=END_OF_MONTH&index_codes=${code}`;

// curl instead of fetch(): Bun's fetch gets ECONNRESET from FRED behind some proxies.
async function text(url: string): Promise<string> {
  const { stdout } = await promisify(execFile)("curl", ["-sfL", "--retry", "3", url], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

const round = (x: number, digits = 6) => Number(x.toFixed(digits));
const month = (date: string) => date.slice(0, 7);

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

async function loadShiller() {
  const rows = (await text(SHILLER_URL)).trim().split("\n").slice(1);
  return rows.map((row) => {
    const [date, price, dividend, , , longRate] = row.split(",");
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
      const [date, value] = row.split(",");
      return [month(date), Number(value) / 100];
    }),
  );
}

function rateFor(ym: string, tbill: Map<string, number>, fallback: number): number {
  return tbill.get(ym) ?? fallback;
}

async function main() {
  const [shiller, tbill] = await Promise.all([loadShiller(), loadTbill()]);
  const lastTbill = [...tbill.values()].at(-1) ?? 0;
  const firstTbillMonth = [...tbill.keys()][0];

  // S&P 500 total return: r_t = (P_{t+1} + D_t / 12) / P_t − 1 (Shiller convention).
  // Dividends are missing at the end of the dataset → carry the last known dividend yield forward.
  let lastYield = 0;
  const spReturns: number[] = [];
  const spRates: number[] = [];
  for (let i = 0; i < shiller.length - 1; i++) {
    const cur = shiller[i];
    const next = shiller[i + 1];
    if (cur.dividend > 0) lastYield = cur.dividend / cur.price;
    const dividend = cur.dividend > 0 ? cur.dividend : cur.price * lastYield;
    spReturns.push(round((next.price + dividend / 12) / cur.price - 1));
    const fallback = cur.month < firstTbillMonth ? cur.longRate : lastTbill;
    spRates.push(round(rateFor(cur.month, tbill, fallback)));
  }
  const sp500: Dataset = {
    id: "sp500",
    name: "S&P 500",
    description: "500 large US companies. Longest history (since 1871).",
    source:
      "Robert Shiller, monthly averages of price + dividends (datasets/s-and-p-500). Dividends after mid-2023 extrapolated from the last known yield.",
    currency: "USD",
    priceType: "average",
    start: shiller[0].month,
    returns: spReturns,
    rates: spRates,
  };

  const msci = async (code: string, id: string, name: string, description: string) => {
    const json = JSON.parse(await text(msciUrl(code)));
    const levels: { level_eod: number; calc_date: number }[] = json.indexes.INDEX_LEVELS;
    const returns: number[] = [];
    const rates: number[] = [];
    for (let i = 1; i < levels.length; i++) {
      const ym = `${String(levels[i].calc_date).slice(0, 4)}-${String(levels[i].calc_date).slice(4, 6)}`;
      returns.push(round(levels[i].level_eod / levels[i - 1].level_eod - 1));
      rates.push(round(rateFor(ym, tbill, lastTbill)));
    }
    const first = String(levels[0].calc_date);
    return {
      id,
      name,
      description,
      source: `MSCI index ${code}, net total return, USD, end of month (msci.com).`,
      currency: "USD",
      priceType: "close",
      start: nextMonth(`${first.slice(0, 4)}-${first.slice(4, 6)}`),
      returns,
      rates,
    } satisfies Dataset;
  };

  const datasets = [
    sp500,
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
  await writeFile(
    "public/data/index.json",
    `${JSON.stringify(datasets.map(({ id, name }) => ({ id, name })))}\n`,
  );
}

await main();
