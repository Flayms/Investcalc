import { leveragedReturn, type MonthMarket } from "@/simulation/leverage";
import { PARTIAL_EXEMPTION_EQUITY, type ScenarioParams } from "@/simulation/params";
import { settleTaxYear, type TaxSettings, vorabpauschale } from "@/simulation/tax";

export type PathMonth = MonthMarket & {
  /** Change of the dollar's value in the investor's currency this month (0 when investing in USD). */
  fx?: number;
  /** Annualised rate earned on cash; defaults to `rate`. */
  cashRate?: number;
};

export type PathResult = {
  /** Net worth before tax at the end of each month (index 0 = start). */
  netWorth: Float64Array;
  /** Net worth after selling everything and paying all taxes at the end. */
  finalAfterTax: number;
  /** Own money paid in (initial investment + contributions). */
  invested: number;
  fees: number;
  taxes: number;
};

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

  // Index level in the investor's currency for the SMA signal (start of path = 1, REQ-011-05).
  const levels: number[] = [];
  let level = 1;
  for (const month of months) {
    level *= (1 + month.r) * (1 + (month.fx ?? 0));
    levels.push(level);
  }
  const aboveSma = (index: number) => {
    const k = Math.max(0, index - lag);
    const n = Math.min(p.smaMonths, k + 1);
    let sum = 0;
    for (let j = k - n + 1; j <= k; j++) sum += levels[j] ?? 0;
    return (levels[k] ?? 0) >= sum / n;
  };

  let cash = p.initialInvestment;
  let loan = 0;
  let taxDebt = 0;
  let fees = 0;
  let taxes = 0;
  let lossCarry = 0;
  let yearFundGains = 0;
  let yearInterest = 0;
  let inMarket = p.strategy === "buyAndHold" || aboveSma(warmup - 1);

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
      fees += cost;
    }
  };

  const sellAll = () => {
    for (const f of funds) {
      if (f.value <= 0) continue;
      const cost = tradingCost(f.value);
      const proceeds = f.value - cost;
      yearFundGains += proceeds - f.basis - f.vapTaxed;
      cash += proceeds;
      fees += cost;
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
    taxes += result.tax;
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
  const worth = () => fund1x.value + fundLev.value + cash - loan - taxDebt;

  if (inMarket) invest();
  for (const f of funds) f.yearStartValue = f.value;
  netWorth[0] = worth();

  for (let m = 1; m <= horizon; m++) {
    const k = warmup + m - 1;
    const month = months[k];
    if (!month) throw new Error(`path too short: month ${k} missing`);

    // Start of month: contribution, then debts, then invest.
    cash += p.monthlyContribution;
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
    const grow = (f: Fund, factor: number) => {
      f.value *= factor;
      f.yearGrowth *= factor;
    };
    // Leverage applies to the index return in USD, the currency effect once (REQ-011-02).
    const currency = 1 + (month.fx ?? 0);
    grow(fund1x, (1 + leveragedReturn(month, unleveraged)) * currency);
    grow(fundLev, (1 + leveragedReturn(month, leveraged)) * currency);
    const interest = (cash * (month.cashRate ?? month.rate)) / 12;
    cash += interest;
    yearInterest += interest;

    // End of month: timing signal, year end, final liquidation.
    if (p.strategy === "sma") {
      const signal = aboveSma(k);
      if (inMarket && !signal) sellAll();
      inMarket = signal;
    }
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
    finalAfterTax: cash - loan - taxDebt,
    invested: p.initialInvestment + p.monthlyContribution * horizon,
    fees,
    taxes,
  };
}
