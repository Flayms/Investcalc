import { settleTaxYear, vorabpauschale } from "@/simulation/tax";

const tax = { enabled: true, rate: 0.26375, partialExemption: 0.3, allowance: 1000 };

describe("REQ-001-09 capital gains tax", () => {
  test("REQ-001-09 partial exemption and allowance reduce the taxable gain", () => {
    const { tax: due } = settleTaxYear({ fundGains: 10_000, interest: 0 }, 0, tax);
    expect(due).toBeCloseTo(0.26375 * (7000 - 1000), 6);
  });

  test("REQ-001-09 gains below the allowance are tax free", () => {
    expect(settleTaxYear({ fundGains: 1000, interest: 200 }, 0, tax).tax).toBe(0);
  });

  test("REQ-001-09 losses are carried forward and offset later gains", () => {
    const loss = settleTaxYear({ fundGains: -5000, interest: 0 }, 0, tax);
    expect(loss.tax).toBe(0);
    expect(loss.lossCarry).toBeCloseTo(-3500, 6);
    const next = settleTaxYear({ fundGains: 10_000, interest: 0 }, loss.lossCarry, tax);
    expect(next.tax).toBeCloseTo(0.26375 * (7000 - 3500 - 1000), 6);
    expect(next.lossCarry).toBe(0);
  });

  test("REQ-001-09 no tax when taxes are disabled", () => {
    expect(settleTaxYear({ fundGains: 1e6, interest: 0 }, 0, { ...tax, enabled: false }).tax).toBe(
      0,
    );
  });
});

describe("REQ-001-10 Vorabpauschale", () => {
  test("REQ-001-10 start value × base rate × 0.7", () => {
    expect(vorabpauschale(10_000, 1.1, 0.025)).toBeCloseTo(175, 6);
  });

  test("REQ-001-10 capped at the year's gain and zero in a losing year", () => {
    expect(vorabpauschale(10_000, 1.01, 0.025)).toBeCloseTo(100, 6);
    expect(vorabpauschale(10_000, 0.9, 0.025)).toBe(0);
  });
});
