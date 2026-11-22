import type { ScenarioParams } from "@/simulation/params";

type Plan = Pick<ScenarioParams, "initialInvestment" | "monthlyContribution">;

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
