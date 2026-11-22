export type TaxSettings = {
  enabled: boolean;
  /** Capital gains tax incl. solidarity surcharge (26.375 %). */
  rate: number;
  /** Share of fund gains that is tax-free (Teilfreistellung, 30 % for equity funds). */
  partialExemption: number;
  /** Yearly tax-free allowance (Sparerpauschbetrag). */
  allowance: number;
};

export type YearIncome = {
  /** Realised fund gains + Vorabpauschale, before partial exemption. */
  fundGains: number;
  /** Interest on cash (no partial exemption). */
  interest: number;
};

/** Tax due for one year. Losses are carried forward (negative `lossCarry`). */
export function settleTaxYear(
  income: YearIncome,
  lossCarry: number,
  s: TaxSettings,
): { tax: number; lossCarry: number } {
  if (!s.enabled) return { tax: 0, lossCarry: 0 };
  const taxable = income.fundGains * (1 - s.partialExemption) + income.interest + lossCarry;
  if (taxable <= 0) return { tax: 0, lossCarry: taxable };
  return { tax: s.rate * Math.max(0, taxable - s.allowance), lossCarry: 0 };
}

/**
 * Vorabpauschale of an accumulating fund for one year: value at the start of the year × base rate × 0.7,
 * capped at the value gain of that holding during the year.
 */
export function vorabpauschale(startValue: number, growthFactor: number, baseRate: number): number {
  return Math.max(0, Math.min(startValue * baseRate * 0.7, startValue * (growthFactor - 1)));
}
