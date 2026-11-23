/**
 * English UI text: the source dictionary. `de.ts` must have the same keys (enforced by its type).
 * Functions take values that are already formatted, so number formats stay in `createFormat`.
 */
export const en = {
  app: {
    tagline:
      "Monte Carlo simulation of ETF savings plans on historical data — leverage, costs and German taxes.",
    views: "Views",
    simulation: "Simulation",
    marketAndData: "Market & data",
    loading: "Loading historical data…",
    loadError: (error: string) => `Could not load the historical data: ${error}`,
  },
  language: {
    label: "Language",
  },
  theme: {
    switchToDark: "Switch to dark theme",
    switchToLight: "Switch to light theme",
  },
  scenarioNames: {
    buyAndHold: "1× buy and hold",
    leveraged: "2× buy and hold",
    leveragedSma: "2× with 10-month SMA",
    numbered: (n: number) => `Scenario ${n}`,
    copy: (name: string) => `${name} (copy)`,
  },
  mobile: {
    view: "View",
    results: "Results",
    settings: "Settings",
    simulating: "Simulating",
  },
  status: {
    simulating: (count: number) => `Simulating ${count} scenario${count === 1 ? "" : "s"}…`,
    analysing: (name: string) => `Analysing “${name}”…`,
  },
  common: {
    about: (label: string) => `About ${label}`,
    recommended: "Recommended:",
    notRecommended: "Not recommended",
    value: (label: string) => `${label} value`,
    updating: "Updating",
    analysing: "Analysing…",
    simulating: "Simulating…",
    noData: "No data.",
    best: "Best",
    current: "Current",
    legend: "Legend",
    median: "Median",
    paidIn: "Paid in",
  },
  /** Units after a typed value. */
  units: {
    months: "mo",
    years: "y",
  },
  errors: {
    periodShorterThanHorizon: (years: string) =>
      `The selected period (${years} years) is shorter than the horizon plus one warm-up year. Use random slicing or a shorter horizon.`,
    periodShorterThanTwoYears: (years: string) =>
      `The selected period (${years} years) is shorter than 2 years.`,
    noPaths: "No paths.",
  },
  scenarioBar: {
    scenarios: "Scenarios",
    reorder: (name: string) => `Reorder ${name}`,
    reorderHint: "Drag to reorder (or focus and press Space, then the arrow keys)",
    show: (name: string) => `Show ${name}`,
    hideHint: "Hide from chart and table",
    showHint: "Show in chart and table",
    new: "New",
    duplicate: "Duplicate",
    remove: "Remove scenario",
    pickedUp: (name: string, position: number, count: number) =>
      `Picked up ${name}, position ${position} of ${count}.`,
    movedTo: (name: string, position: number) => `${name} moved to position ${position}.`,
    droppedAt: (name: string, position: number) => `${name} dropped at position ${position}.`,
    dropped: (name: string) => `${name} dropped.`,
    cancelled: (name: string) => `Moving ${name} cancelled.`,
    instructions:
      "To reorder, press Space or Enter, move with the arrow keys, then press Space or Enter again. Escape cancels.",
  },
  scenarioEditor: {
    title: "Scenario settings",
    description: "What you choose per scenario. Costs, taxes and the data period are shared.",
    name: "Name",
    index: "Index",
    indexHelp:
      "MSCI World: developed markets only (~23 countries, ~70 % USA). MSCI ACWI (≈ FTSE All-World): World + emerging markets. S&P 500: 500 large US companies.",
    indexRecommendation:
      "S&P 500 for the longest history (since 1871, many crashes); MSCI data only starts in 2001.",
  },
  globalSettings: {
    title: "Simulation",
    description: "Shared by all scenarios.",
    seed: "Seed",
    seedHelp: "Start value of the random generator. Same seed = same paths = reproducible results.",
  },
  sharedSettings: {
    title: "Costs & taxes",
    description: "Shared by all scenarios: facts about your products, broker and tax situation.",
  },
  historicalPeriod: {
    label: "Historical period",
    help: "Only months inside this period are used to generate paths. Indices with a shorter history use the part of the period they cover.",
    recommendation: "The full period: more market regimes make the distribution more robust.",
    indexFrom: (name: string, year: number) => `${name} from ${year}`,
    euroFrom: (year: number) => `In euros from ${year}: earlier months have no exchange rate.`,
  },
  groups: {
    savingsPlan: "Savings plan",
    etfMix: "ETF mix & leverage",
    strategy: "Strategy",
    productCosts: "Product costs",
    tradingCosts: "Trading costs",
    germanTaxes: "German taxes",
  },
  /** Label, help and recommendation of every setting, keyed by setting. */
  fields: {
    monthlyContribution: {
      label: "Monthly investment",
      help: "Amount invested every month on the same date (savings plan / DCA).",
    },
    initialInvestment: {
      label: "Initial investment",
      help: "One-off amount invested at the start.",
    },
    leveragedShare: {
      label: "Share in leveraged ETF",
      help: "Part of every contribution that goes into the leveraged ETF; the rest goes into the 1× ETF. 0 % = only 1×, 100 % = only leveraged. No rebalancing.",
      recommendation:
        "Depends on your risk tolerance. Compare 0 %, 50 % and 100 % as separate scenarios.",
    },
    leverage: {
      label: "Leverage factor",
      help: "Daily-reset factor of the leveraged ETF (real products: 2× or 3×). Includes volatility drag: the daily reset loses value in choppy markets, roughly (L²−L)/2 × variance per year.",
      recommendation: "See the leverage explorer below for the factor with the best median.",
    },
    strategy: {
      label: "Timing",
      help: "Buy and hold never sells. SMA sells everything when the index closes a month below its simple moving average and buys back when it closes above.",
      recommendation:
        "Buy and hold for 1×. SMA can reduce crash risk of leveraged ETFs but triggers taxes and costs.",
      options: { buyAndHold: "Buy and hold", sma: "SMA trend filter" },
    },
    smaMonths: {
      label: "SMA window",
      help: "Length of the simple moving average in months (10 months ≈ 200 trading days).",
      recommendation: "10 months (classic 200-day line).",
    },
    borrowFromFuture: {
      label: "Borrow from your future self",
      help: "Take a loan worth the next N monthly contributions and invest it immediately; the contributions then repay the loan. Compares 'invest as early as possible' with the plain savings plan.",
      recommendation: "Off by default. Only pays off when returns beat the loan rate.",
    },
    loanMonths: {
      label: "Loan term",
      help: "Number of future monthly contributions borrowed and invested up front.",
    },
    loanRate: {
      label: "Loan interest rate",
      help: "Yearly interest rate of the loan (e.g. consumer credit or Lombard loan).",
      recommendation: "German consumer loans: ~5–8 %.",
    },
    terUnleveraged: {
      label: "TER 1× ETF",
      help: "Total expense ratio per year of the unleveraged ETF, deducted monthly.",
      recommendation: "0.07–0.25 % for large World / S&P 500 ETFs. Default 0.20 %.",
    },
    terLeveraged: {
      label: "TER leveraged ETF",
      help: "Total expense ratio per year of the leveraged ETF.",
      recommendation: "Typical 0.35–0.75 %. Default 0.60 %.",
    },
    includeSofr: {
      label: "Include SOFR financing",
      help: "A leveraged ETF borrows (L − 1) × its assets and pays the short rate (SOFR; historically the 3-month T-bill rate) on it.",
      recommendation:
        "Keep on. Real leveraged ETFs always pay financing; switching it off only shows its influence.",
    },
    financingSpread: {
      label: "Financing spread over SOFR",
      help: "Extra yearly swap cost above SOFR on the borrowed part.",
      recommendation: "0.3–1 % for real products. Default 0.5 %.",
    },
    orderFee: {
      label: "Order fee",
      help: "Fixed fee per order (every monthly purchase, every sale).",
      recommendation: "€0–1.50 for savings plans at German online brokers. Default €1.",
    },
    bidAskSpread: {
      label: "Bid-ask spread",
      help: "Difference between buy and sell price. Half of it is paid on every buy and every sale.",
      recommendation: "0.02–0.2 % for liquid ETFs. Default 0.10 %.",
    },
    taxesEnabled: {
      label: "Apply German taxes",
      help: "Abgeltungsteuer on realised gains, Vorabpauschale every year, loss carry-forward.",
      recommendation: "Keep on; switch off only to see the influence of taxes.",
    },
    taxRate: {
      label: "Tax rate",
      help: "Abgeltungsteuer 25 % + 5.5 % Solidaritätszuschlag = 26.375 %. With church tax ≈ 27.8–28 %.",
      recommendation: "26.375 % (27.82 % / 27.99 % with church tax).",
    },
    partialExemption: {
      label: "Teilfreistellung (30 %)",
      help: "30 % of gains of equity funds (≥ 51 % equities) are tax-free. Assumed for leveraged ETFs too.",
      recommendation: "On for equity ETFs.",
    },
    allowance: {
      label: "Tax allowance",
      help: "Sparerpauschbetrag per year: income up to this amount is tax-free.",
      recommendation: "€1,000 single, €2,000 jointly assessed couples.",
    },
    baseRate: {
      label: "Basiszins",
      help: "Base rate for the Vorabpauschale (value at the start of the year × Basiszins × 0.7, at most the year's gain). Set yearly by the Bundesbank.",
      recommendation: "Recent years: 2.29 % (2024), 2.53 % (2025). Default 2.5 %.",
    },
    currency: {
      label: "Currency",
      help: "Currency you invest and pay taxes in. In euros, every month's index return is converted with that month's change of the euro/dollar rate (before 1999 via the D-Mark). Leveraged ETFs apply their leverage to the dollar return; the currency effect is not leveraged. Cash earns the German / euro money market rate.",
      recommendation:
        "Euro for investors in Germany: the currency risk of US and world equities is part of your result. US dollar shows the index alone and the longer history.",
      options: { EUR: "Euro", USD: "US dollar" },
    },
    horizonYears: {
      label: "Horizon",
      help: "How long you invest. All scenarios use the same horizon.",
    },
    sampling: {
      label: "Path generation",
      help: "Historical windows: every real N-year period of the history (few, overlapping paths). Random slicing: thousands of paths stitched together from random blocks of history (block bootstrap).",
      recommendation:
        "Random slicing for robust distributions; historical windows to see what actually happened.",
      options: { bootstrap: "Random slicing (block bootstrap)", rolling: "Historical windows" },
    },
    blockMonths: {
      label: "Mean block length",
      help: "Average length of the random history blocks. Blocks keep crashes, volatility regimes and interest rates together; single months would destroy them.",
      recommendation: "12–36 months. Default 24.",
    },
    paths: {
      label: "Number of paths",
      help: "How many random paths are simulated per scenario. More paths = smoother percentiles, slower.",
      recommendation: "2,000 or more.",
    },
  },
  goals: {
    median: {
      short: "Median",
      help: "The typical outcome: half of the paths end above, half below.",
    },
    badCase: {
      short: "Bad case (P10)",
      help: "The outcome only 1 in 10 paths ends below: how bad it gets in a bad decade.",
    },
    loss: {
      short: "Chance of loss",
      help: "How often you end with less than you paid in.",
    },
  },
  explorer: {
    title: "Value explorer: which setting pays off?",
    description: (name: string) =>
      `“${name}” simulated for every value of one slider, all else unchanged, on the same paths (up to 500). Final value after taxes.`,
    diagram: "Diagram",
    distribution: "Distribution",
    tradeoff: "Trade-off",
    exploredSlider: "Explored slider",
    optimiseFor: "Optimise for",
    months: (n: number) => `${n} months`,
    assumeShare: (percent: number) => `${percent} % in the leveraged ETF`,
    assumeLeverage: (factor: number) => `a ${factor}× leveraged ETF`,
    assumeSma: "the SMA trend filter",
    assumptionNote: (parts: string[]) =>
      `This slider has no effect with the scenario's current settings, so the explorer assumes ${parts.join(" and ")}.`,
    /** "€400,000 median": the goal's figure followed by this. */
    metric: {
      median: "median",
      badCase: "in the bad case (P10)",
      loss: "chance of loss",
    },
    has: {
      median: (value: string) => `${value} has the highest median`,
      badCase: (value: string) => `${value} has the best bad case (p10)`,
      loss: (value: string) => `${value} has the lowest chance of loss`,
    },
    alsoMedian: (amount: string) => `, median ${amount}`,
    alsoLoss: (percent: string) => `, ${percent} chance of loss`,
    isCurrent: " — that is your current setting.",
    vsCurrent: (amount: string, value: string) => ` vs ${amount} at your current ${value}.`,
    compareMedian: (best: string, now: string) => `median ${best} vs ${now}`,
    compareBadCase: (best: string, now: string) => `bad case (P10) ${best} vs ${now}`,
    compareLoss: (best: string, now: string) => `chance of loss ${best} vs ${now}`,
    use: (value: string) => `Use ${value}`,
    goodCase: "Good case (P90)",
    badCase: "Bad case (P10)",
    chanceOfLoss: "Chance of loss",
    medianOf: (name: string) => `${name} (median)`,
    finalValueBy: (slider: string) => `Final value after taxes by ${slider}`,
    finalValueLog: "Final value after taxes (log)",
    distributionNote:
      "Each band holds the middle 90 %, 80 % and 50 % of the paths. A wider band means less certainty; a value pays off when its median rises without its bad end sinking below what you paid in.",
    oneValue: (slider: string) => `One ${slider.toLowerCase()} value`,
    medianVsLossBy: (slider: string) => `Median against chance of loss by ${slider}`,
    lossAxis: "Chance of loss (less is better)",
    medianLog: "Median final value (log)",
    tradeoffNote:
      "Up and to the left is better: more median for less risk. Where the line turns flat or bends right, extra risk no longer buys extra median.",
  },
  insight: {
    chartBest: (goal: string, slider: string, best: string) =>
      `${goal} by ${slider}; best at ${best}`,
    chartCalculating: (goal: string, slider: string) => `${goal} by ${slider}: calculating`,
    byValue: (goal: string) => `${goal} by value`,
    best: (value: string) => `best ${value}`,
    calculating: " · calculating…",
    explore: "Explore",
    exploreSlider: (slider: string) => `Explore ${slider}`,
    exploreHint: "Open this slider's diagram in the value explorer",
  },
  fanChart: {
    title: "Net worth over time",
    description:
      "Median of every scenario. Bands for the selected scenario: P25–P75 (dark) and P10–P90 (light). Before the final sale's taxes.",
    yearTick: (years: number) => `${years}y`,
    year: (year: string) => `Year ${year}`,
  },
  results: {
    title: "Final value after taxes — percentiles",
    description:
      "After selling everything at the end of the horizon and paying all taxes and loans. P5 = only 5 % of the paths ended lower.",
    yearlyReturnNote: "Shown as money-weighted yearly return of each percentile.",
    unit: "Unit",
    perYear: "% p.a.",
    scenario: "Scenario",
    medianPerYear: "Median p.a.",
    lossShort: "P(loss)",
    fees: "Fees",
    taxes: "Taxes",
    paths: "Paths",
    shading: "Shading compares the scenarios per percentile: lighter = lower, darker = higher;",
    isBest: "= best.",
    footnote:
      "Median p.a. = money-weighted yearly return of the median path. P(loss) = share of paths ending below the amount paid in. Fees and taxes are medians over all paths.",
  },
  distributionChart: {
    legend: "Percentile chart legend",
    paidInZero: "Paid in (0 % p.a.)",
    yearlyReturn: "Yearly return",
    finalValue: "Final value after taxes",
    chartLabel: (measure: string) => `${measure} by percentile, P1 to P99, per scenario`,
    endedLower: (percentile: number) => `${percentile}% of the paths ended lower.`,
  },
  factors: {
    title: "What each factor costs",
    description: (name: string) =>
      `How much higher the median final value of “${name}” would be without each factor (up to 1,000 paths).`,
    medianFinalValue: "Median final value:",
    medianCost: "Median cost",
    names: {
      ter: "TER",
      sofr: "SOFR financing",
      spread: "Financing spread",
      trading: "Order fees + bid-ask",
      taxes: "Taxes",
    },
  },
  market: {
    title: "Current market",
    description: (month: string) =>
      `Based on the latest data month (${month}), total return in USD.`,
    index: "Index",
    phases: {
      bull: { label: "Bull market", text: "Less than 10 % below the all-time high." },
      correction: { label: "Correction", text: "10–20 % below the all-time high." },
      bear: { label: "Bear market", text: "20 % or more below the all-time high." },
    },
    distanceFromHigh: "Distance from all-time high",
    aboveSma: (months: number) => `Above ${months}-month SMA`,
    belowSma: (months: number) => `Below ${months}-month SMA`,
    keyIndicators: "Key indicators",
    trailing: (years: number) => `${years}Y${years > 1 ? " p.a." : ""}`,
    volatility12m: "Volatility 12 months",
    longTerm: (value: string) => `(long-term ${value})`,
    shortRate: "Short rate",
    indicatorsNote:
      "High volatility raises the drag of leveraged ETFs; the short rate (3-month T-bill, SOFR proxy) is what they pay on borrowed money. The SMA strategy is invested while the index is above its SMA. Not investment advice.",
    timeFrame: "Time frame",
    /** Tab of a time frame; `undefined` years = the whole history. */
    timeFrameTab: (years?: number) => (years === undefined ? "Max" : `${years}Y`),
    since: (month: string) => `since ${month}`,
    lastYears: (years: number) => `last ${years} years`,
    indexLegend: (name: string, range: string, log: boolean) =>
      `${name} (${range}, start = 100${log ? ", log scale" : ""})`,
    sma: (months: number) => `${months}-month SMA`,
    bearMarket: "Bear market",
    selectedTimeFrame: "Selected time frame",
    totalReturn: "Total return",
    cagr: "CAGR",
    volatility: "Volatility",
    maxDrawdown: "Max drawdown",
  },
  cycles: {
    title: "Bear and bull markets",
    description: (name: string) =>
      `${name}: declines of 20 % or more from the all-time high, from the peak to the lowest point before the high was regained. Bull markets run from a bear market's low to the next peak.`,
    bearMarketsSince: (year: string) => `Bear markets since ${year}`,
    medianDecline: (value: string) => `median decline ${value}`,
    medianRecovery: "Median time to recover",
    peakToHigh: "peak to new all-time high",
    currentBull: "Current bull market",
    bullSince: (month: string, duration: string) => `since ${month} · ${duration}`,
    medianBull: "Median bull market",
    completed: (duration: string, count: number) => `${duration} · ${count} completed`,
    noBearMarket: (month: string) => `No bear market in this time frame (since ${month}).`,
    peak: "Peak",
    low: "Low",
    decline: "Decline",
    peakToLow: "Peak to low",
    recovered: "Recovered",
    peakToRecovery: "Peak to recovery",
    firstMonth: "First data month; the peak may be earlier",
    ongoing: "ongoing",
    note: "Based on monthly total returns, so short crashes look milder than in daily closes.",
    averageNote:
      " This index uses monthly average prices: e.g. 2020 and 2022 stay just above −20 % here.",
  },
  dataBasis: {
    title: "Data basis",
    description:
      "Monthly total returns (dividends reinvested) in USD. Short rate (SOFR proxy): 3-month US T-bill (FRED TB3MS), 1926–1933 the 1-month T-bill, before that the long-term rate.",
    index: "Index",
    period: "Period",
    months: "Months",
    cagr: "CAGR",
    volatility: "Volatility",
    dailyFrom: "Daily data from",
    source: "Source",
    euro: (from: string, to: string) => `Euro (${from} – ${to})`,
    euroText:
      "Simulations in euros convert each month's return with that month's change of the euro/dollar rate and pay the 3-month money market rate (Germany, euro area) on cash.",
    pathsTitle: "How paths are generated",
    historicalWindows: "Historical windows",
    historicalWindowsText: "replay every real period of the chosen length.",
    randomSlicing: "Random slicing",
    randomSlicingText:
      "uses a stationary block bootstrap: each path is stitched together from random contiguous blocks of history (mean length configurable) instead of single random months, so crashes, volatility regimes and interest rates stay together. This matters for leveraged ETFs (volatility drag) and SMA strategies (trends).",
    assumptionsTitle: "Assumptions & limits",
    assumptions: [
      "Returns in euros (or US dollars, see the currency setting); leveraged ETFs are dollar-based, their currency effect is not leveraged. Inflation is ignored.",
      "S&P 500 uses monthly average prices (smooths monthly returns); SMA signals act one month later.",
      "Leveraged ETFs: daily reset, drag from the realised variance of the same month's daily returns (estimated where no daily data exists), financing on (L − 1).",
      "German taxes: 26.375 %, 30 % Teilfreistellung, allowance, Vorabpauschale, loss carry-forward.",
      "Past returns do not guarantee future returns. Not investment advice.",
    ],
  },
  /** Texts of the data files, so they can be translated; English must equal the files. */
  datasets: {
    sp500: {
      name: "S&P 500",
      description: "500 large US companies. Longest history (since 1871).",
      source:
        "Robert Shiller, monthly averages of price + dividends (datasets/s-and-p-500). Dividends after mid-2023 extrapolated from the last known yield. Daily variance of the US total market (Kenneth French) from 1926-07; earlier and newer months estimated (×1.27 squared monthly return).",
    },
    "us-market": {
      name: "US total market",
      description:
        "All listed US stocks, value weighted (~4,000 companies, like a total market ETF). Month-end data since 1926.",
      source:
        "Kenneth French data library (CRSP value-weighted market, Mkt-RF + RF), monthly total returns; variance from daily returns.",
    },
    "msci-world": {
      name: "MSCI World",
      description: "~1,400 large and mid caps in 23 developed countries. No emerging markets.",
      source:
        "MSCI index 990100, net total return, USD, daily levels (msci.com); month = last level of the month.",
    },
    "msci-acwi": {
      name: "MSCI ACWI (All World)",
      description:
        "MSCI World plus ~24 emerging markets (~2,500 stocks). Comparable to FTSE All-World.",
      source:
        "MSCI index 892400, net total return, USD, daily levels (msci.com); month = last level of the month.",
    },
    eur: {
      name: "Euro",
      source:
        "Exchange rate: Deutsche Bundesbank, DM per US dollar (Frankfurt fixing, converted at 1.95583 DM per euro) until 1998, ECB euro reference rate from 1999; last quote of each month. Euro short rate: 3-month money market rate for Germany (OECD via FRED IR3TIB01DEM156N), latest months carried forward.",
    },
  },
};

export type Messages = typeof en;
