import type { ScenarioParams } from "@/simulation/params";

type Plan = Pick<ScenarioParams, "initialInvestment" | "monthlyContribution">;

/**
 * The payments to compute a yearly return from. Inflation-adjusted, the real amount paid in is
 * spread evenly over the months (approximation: real contributions shrink slightly over time,
 * REQ-013-05).
 */
export function paymentPlan(
  params: Plan & Pick<ScenarioParams, "inflationAdjusted">,
  invested: number,
  years: number,
): Plan {
  const { initialInvestment, monthlyContribution } = params;
  if (!params.inflationAdjusted) return { initialInvestment, monthlyContribution };
  return { initialInvestment, monthlyContribution: (invested - initialInvestment) / (years * 12) };
}

/**
 * Money-weighted yearly return that turns the paid-in amount into `final` after `years`
 * (approximation: initial lump sum plus an annuity of monthly contributions).
 */
export function annualReturn(final: number, plan: Plan, years: number): number {
  if (final <= 0) return -1;
  const months = years * 12;
  const fv = (r: number) =>
    plan.initialInvestment * (1 + r) ** months +
    (r === 0
      ? plan.monthlyContribution * months
      : (plan.monthlyContribution * (1 + r) * ((1 + r) ** months - 1)) / r);
  let lo = -0.5;
  let hi = 0.5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (fv(mid) > final) hi = mid;
    else lo = mid;
  }
  return (1 + lo) ** 12 - 1;
}

/** Yearly return of a scenario's final value, nominal or real like its results (REQ-013-05). */
export function yearlyReturn(
  final: number,
  params: Plan & Pick<ScenarioParams, "inflationAdjusted">,
  invested: number,
  years: number,
): number {
  return annualReturn(final, paymentPlan(params, invested, years), years);
}

/** Says what the amounts mean when they are inflation-adjusted (REQ-013-06). */
export const inflationNote = (adjusted: boolean | undefined) =>
  adjusted ? "Inflation-adjusted: amounts in purchasing power at the start." : "";
