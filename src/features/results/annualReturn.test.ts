import { annualReturn, paymentPlan } from "@/features/results/annualReturn";

const plan = (initialInvestment: number, monthlyContribution: number) => ({
  initialInvestment,
  monthlyContribution,
});

test("REQ-007-02 a lump sum that doubles in 10 years returns about 7.2 % p.a.", () => {
  expect(annualReturn(2000, plan(1000, 0), 10)).toBeCloseTo(2 ** (1 / 10) - 1, 6);
});

test("REQ-007-02 getting back exactly what was paid in is 0 % p.a.", () => {
  expect(annualReturn(1000 + 100 * 120, plan(1000, 100), 10)).toBeCloseTo(0, 6);
});

test("REQ-007-02 a higher final value means a higher yearly return", () => {
  const p = plan(1000, 100);
  expect(annualReturn(20_000, p, 10)).toBeGreaterThan(annualReturn(15_000, p, 10));
  expect(annualReturn(10_000, p, 10)).toBeLessThan(0);
});

test("REQ-007-02 losing everything is -100 % p.a.", () => {
  expect(annualReturn(0, plan(1000, 100), 10)).toBe(-1);
});

test("REQ-013-05 inflation-adjusted, the real amount paid in is spread over the months", () => {
  const params = { initialInvestment: 1000, monthlyContribution: 100, inflationAdjusted: true };
  expect(paymentPlan(params, 1000 + 90 * 120, 10)).toEqual(plan(1000, 90));
  // Getting back the real amount paid in is a real return of about 0 % p.a.
  expect(annualReturn(1000 + 90 * 120, paymentPlan(params, 1000 + 90 * 120, 10), 10)).toBeCloseTo(
    0,
    6,
  );
});

test("REQ-013-05 nominal results keep the contributions as set", () => {
  const params = { initialInvestment: 1000, monthlyContribution: 100, inflationAdjusted: false };
  expect(paymentPlan(params, 99_999, 10)).toEqual(plan(1000, 100));
});
