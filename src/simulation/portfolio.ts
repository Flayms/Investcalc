import type { MonthDays } from "@/simulation/dataset";
import { leveragedReturn, type MonthMarket } from "@/simulation/leverage";
import { PARTIAL_EXEMPTION_EQUITY, type ScenarioParams } from "@/simulation/params";
import { settleTaxYear, type TaxSettings, vorabpauschale } from "@/simulation/tax";

export type PathMonth = MonthMarket & {
  /** Change of the dollar's value in the investor's currency this month (0 when investing in USD). */
  fx?: number;
  /** Annualised rate earned on cash; defaults to `rate`. */
  cashRate?: number;
  /** Change of consumer prices in the investor's currency this month. */
  inflation?: number;
  /** The month's trading days, if daily data exists (REQ-015-01). */
  days?: MonthDays;
};

export type PathResult = {
  /** Net worth before tax at the end of each month (index 0 = start). */
  netWorth: Float64Array;
  /** Net worth after selling everything and paying all taxes at the end. */
  finalAfterTax: number;
  /** Own money paid in (initial investment + contributions). */
  invested: number;
  /** Own money paid in by the end of each month (index 0 = start). */
  paidIn: Float64Array;
  fees: number;
  taxes: number;
};

/** Trading days a month without daily data counts as in the moving average (REQ-015-03). */
export const DAYS_PER_MONTH = 21;

/** Average of the last n daily index levels (REQ-015-01). */
export class RollingSma {
  readonly ring: Float64Array;
  sum = 0;
  count = 0;
  /** Slot of the next level in `ring`. */
  next = 0;
  /** The latest level. */
  level = 1;

  constructor(readonly n: number) {
    this.ring = new Float64Array(n);
  }

  push(level: number) {
    const ring = this.ring;
    if (this.count === this.n) this.sum -= ring[this.next] as number;
    else this.count++;
    ring[this.next] = level;
    this.sum += level;
    if (++this.next === this.n) this.next = 0;
    this.level = level;
  }

  /** A month without daily data: its days grow evenly from the last level to `level` (REQ-015-03). */
  pushMonth(level: number) {
    const daily = (level / this.level) ** (1 / DAYS_PER_MONTH);
    for (let j = 1; j < DAYS_PER_MONTH; j++) this.push(this.level * daily);
    this.push(level);
  }

  get average() {
    return this.count === 0 ? this.level : this.sum / this.count;
  }

  /** Whether the latest level is at or above the average. */
  above() {
    return this.count === 0 || this.level * this.count >= this.sum;
  }
}

type Fund = {
  share: number;
  value: number;
  /** Cost basis incl. purchase costs. */
  basis: number;
  /** Vorabpauschale already taxed, not taxed again at sale. */
  vapTaxed: number;
  yearStartValue: number;
  yearGrowth: number;
};

/**
 * Simulates one path month by month. `months` holds `warmup` months of history (only used for SMA
 * signals) followed by the investment horizon.
 */
export type PathOptions = {
  /**
   * Months between the SMA signal and acting on it. Use 1 for monthly-average prices (Shiller), where
   * acting at the same month's average price would look ahead by about half a month.
   */
  signalLagMonths?: number;
};

export function simulatePath(
  months: PathMonth[],
  warmup: number,
  p: ScenarioParams,
  options: PathOptions = {},
): PathResult {
  const lag = options.signalLagMonths ?? 0;
  const horizon = months.length - warmup;
  const tax: TaxSettings = {
    enabled: p.taxesEnabled,
    rate: p.taxRate,
    partialExemption: p.partialExemption ? PARTIAL_EXEMPTION_EQUITY : 0,
    allowance: p.allowance,
  };
  const unleveraged = {
    leverage: 1,
    ter: p.terUnleveraged,
    includeSofr: false,
    financingSpread: 0,
  };
  const leveraged = {
    leverage: p.leverage,
    ter: p.terLeveraged,
    includeSofr: p.includeSofr,
    financingSpread: p.financingSpread,
  };
  const newFund = (share: number): Fund => ({
    share,
    value: 0,
    basis: 0,
    vapTaxed: 0,
    yearStartValue: 0,
    yearGrowth: 1,
  });
  const fund1x = newFund(1 - p.leveragedShare);
  const fundLev = newFund(p.leveragedShare);
  const funds = [fund1x, fundLev];

  // Index level in the investor's currency for the SMA signal (REQ-011-05). Monthly signals are
  // kept per month so that they can be acted on `lag` months later (average prices).
  const sma = p.strategy === "sma" ? new RollingSma(p.smaDays) : undefined;
  const monthSignals: boolean[] = [];
  const monthSignal = (k: number) => monthSignals[Math.max(0, k - lag)] ?? true;
  /** Feeds a whole month into the average; returns the signal at its close. */
  const feedMonth = (month: PathMonth) => {
    if (!sma) return true;
    const days = month.days;
    if (!days) {
      sma.pushMonth(sma.level * (1 + month.r) * (1 + (month.fx ?? 0)));
    } else {
      const growth = days.growth;
      for (let j = 0; j < growth.length; j++) sma.push(sma.level * (growth[j] as number));
    }
    return sma.above();
  };
  for (let k = 0; k < warmup; k++) monthSignals.push(feedMonth(months[k] as PathMonth));

  let cash = p.initialInvestment;
  let loan = 0;
  let taxDebt = 0;
  let fees = 0;
  let taxes = 0;
  let lossCarry = 0;
  // Price level relative to the start; amounts are reported in purchasing power at the start when
  // inflation-adjusted (REQ-013-01). Taxes and the simulation itself stay nominal (REQ-013-04).
  let price = 1;
  const report = (amount: number) => (p.inflationAdjusted ? amount / price : amount);
  let paid = p.initialInvestment;
  let yearFundGains = 0;
  let yearInterest = 0;
  let inMarket = p.strategy === "buyAndHold" || monthSignal(warmup - 1);
  /** A switch signalled at a daily close, made at the next trading day's close (REQ-015-01). */
  let pending = false;

  const loanMonthlyRate = p.loanRate / 12;
  if (p.borrowFromFuture && p.monthlyContribution > 0) {
    const n = p.loanMonths;
    loan =
      loanMonthlyRate === 0
        ? p.monthlyContribution * n
        : (p.monthlyContribution * (1 - (1 + loanMonthlyRate) ** -n)) / loanMonthlyRate;
    cash += loan;
  }

  const tradingCost = (amount: number) => p.orderFee + (amount * p.bidAskSpread) / 2;

  const invest = () => {
    const available = cash;
    for (const f of funds) {
      const amount = available * f.share;
      if (amount <= 0) continue;
      const cost = tradingCost(amount);
      if (cost >= amount) continue;
      cash -= amount;
      f.value += amount - cost;
      f.basis += amount;
      fees += report(cost);
    }
  };

  const sellAll = () => {
    for (const f of funds) {
      if (f.value <= 0) continue;
      const cost = tradingCost(f.value);
      const proceeds = f.value - cost;
      yearFundGains += proceeds - f.basis - f.vapTaxed;
      cash += proceeds;
      fees += report(cost);
      f.value = 0;
      f.basis = 0;
      f.vapTaxed = 0;
      f.yearStartValue = 0;
      f.yearGrowth = 1;
    }
  };

  const settleYear = () => {
    const result = settleTaxYear(
      { fundGains: yearFundGains, interest: yearInterest },
      lossCarry,
      tax,
    );
    lossCarry = result.lossCarry;
    taxes += report(result.tax);
    const paid = Math.min(cash, result.tax);
    cash -= paid;
    taxDebt += result.tax - paid;
    yearFundGains = 0;
    yearInterest = 0;
    for (const f of funds) {
      f.yearStartValue = f.value;
      f.yearGrowth = 1;
    }
  };

  const netWorth = new Float64Array(horizon + 1);
  const paidIn = new Float64Array(horizon + 1);
  const worth = () => report(fund1x.value + fundLev.value + cash - loan - taxDebt);

  if (inMarket) invest();
  for (const f of funds) f.yearStartValue = f.value;
  netWorth[0] = worth();
  paidIn[0] = paid;

  const grow = (f: Fund, factor: number) => {
    f.value *= factor;
    f.yearGrowth *= factor;
  };
  /**
   * Market moves and interest for the whole month or a part of it (REQ-015-02): `market` has the
   * return and variance of the days, `fraction` their share of the month's trading days.
   */
  const advance = (month: PathMonth, market: MonthMarket, currency: number, fraction: number) => {
    // Leverage applies to the index return in USD, the currency effect once (REQ-011-02).
    grow(fund1x, (1 + leveragedReturn(market, unleveraged, fraction)) * currency);
    grow(fundLev, (1 + leveragedReturn(market, leveraged, fraction)) * currency);
    const interest = ((cash * (month.cashRate ?? month.rate)) / 12) * fraction;
    cash += interest;
    yearInterest += interest;
  };

  for (let m = 1; m <= horizon; m++) {
    const k = warmup + m - 1;
    const month = months[k];
    if (!month) throw new Error(`path too short: month ${k} missing`);

    // Start of month: contribution, then debts, then invest.
    cash += p.monthlyContribution;
    paid += report(p.monthlyContribution);
    paidIn[m] = paid;
    const debtPaid = Math.min(cash, taxDebt);
    cash -= debtPaid;
    taxDebt -= debtPaid;
    if (loan > 0) {
      loan *= 1 + loanMonthlyRate;
      const payment = Math.min(cash, loan, p.monthlyContribution);
      cash -= payment;
      loan -= payment;
      if (loan < 1e-9) loan = 0;
    }
    if (inMarket) invest();

    // During the month: market moves, cash earns interest.
    const days = sma ? month.days : undefined;
    if (sma && days) {
      // Daily signal (REQ-015-01): walk the trading days, switch at the close after a signal.
      const n = days.r.length;
      const growth = days.growth;
      let from = 0;
      /** Market moves of the days `from` … `to` − 1; the whole month earns the month's return. */
      const advanceDays = (to: number) => {
        if (from === 0 && to === n) {
          advance(month, month, 1 + (month.fx ?? 0), 1);
        } else {
          let log = 0;
          let variance = 0;
          let currency = 1;
          for (let j = from; j < to; j++) {
            const x = Math.log1p(days.r[j] as number);
            log += x;
            variance += x * x;
            currency *= 1 + (days.fx?.[j] ?? 0);
          }
          advance(
            month,
            { r: Math.expm1(log), rate: month.rate, variance },
            currency,
            (to - from) / n,
          );
        }
        from = to;
      };
      // The rolling average is updated in local variables: this loop runs for every trading day.
      const { ring, n: window } = sma;
      let { level, sum, count, next } = sma;
      let held: boolean = inMarket;
      let switchNext: boolean = pending;
      for (let j = 0; j < n; j++) {
        level *= growth[j] as number;
        if (count === window) sum -= ring[next] as number;
        else count++;
        ring[next] = level;
        sum += level;
        if (++next === window) next = 0;
        if (switchNext) {
          advanceDays(j + 1);
          if (held) sellAll();
          else invest();
          held = !held;
          switchNext = false;
        }
        if (level * count >= sum !== held) switchNext = true;
      }
      sma.level = level;
      sma.sum = sum;
      sma.count = count;
      sma.next = next;
      inMarket = held;
      pending = switchNext;
      if (from < n) advanceDays(n);
      monthSignals.push(sma.above());
    } else {
      advance(month, month, 1 + (month.fx ?? 0), 1);
      if (sma) {
        // Month without daily data: checked at the month's close (REQ-015-03).
        monthSignals.push(feedMonth(month));
        pending = false;
        const signal = monthSignal(k);
        if (inMarket && !signal) sellAll();
        inMarket = signal;
      }
    }
    price *= 1 + (month.inflation ?? 0);

    // End of month: year end, final liquidation.
    if (m === horizon) {
      // Net worth before the final sale, so the curve shows holdings, not the liquidation.
      netWorth[m] = worth();
      sellAll();
      settleYear();
    } else if (m % 12 === 0) {
      if (tax.enabled) {
        for (const f of funds) {
          const vap = vorabpauschale(f.yearStartValue, f.yearGrowth, p.baseRate);
          f.vapTaxed += vap;
          yearFundGains += vap;
        }
      }
      settleYear();
    }
    if (m < horizon) netWorth[m] = worth();
  }

  return {
    netWorth,
    finalAfterTax: report(cash - loan - taxDebt),
    invested: paid,
    paidIn,
    fees,
    taxes,
  };
}
