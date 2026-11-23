import type { Dataset } from "@/simulation/dataset";
import { defaultGlobal, defaultScenario } from "@/simulation/params";
import { buildPaths, factorImpact, runScenario } from "@/simulation/simulate";

const dataset: Dataset = {
  id: "test",
  name: "Test",
  description: "",
  source: "",
  currency: "USD",
  priceType: "close",
  start: "2000-01",
  returns: Array.from({ length: 240 }, (_, i) => (i % 7 === 0 ? -0.04 : 0.015)),
  rates: Array(240).fill(0.02),
  variance: Array.from({ length: 240 }, (_, i) => 0.001 + i * 1e-5),
};

const scenario = { ...defaultScenario, etfId: "test", fromYear: 2000, toYear: 2019 };
const global = { ...defaultGlobal, horizonYears: 5, paths: 300 };

describe("REQ-001-02 data period", () => {
  test("REQ-001-02 rolling windows only use months inside the selected period", () => {
    const all = runScenario(dataset, scenario, { ...global, sampling: "rolling" });
    const recent = runScenario(
      dataset,
      { ...scenario, fromYear: 2010 },
      { ...global, sampling: "rolling" },
    );
    expect(all.pathCount).toBe(240 - 72 + 1);
    expect(recent.pathCount).toBe(120 - 72 + 1);
  });
});

describe("REQ-010-01 drag from the same month's daily variance", () => {
  test("REQ-010-01 every path month carries the dataset's variance of that month", () => {
    const { paths } = buildPaths(dataset, scenario, { ...global, sampling: "rolling" });
    paths[5]?.forEach((month, k) => {
      expect(month.variance).toBe(dataset.variance[5 + k]);
    });
    expect(paths[5]?.[0]?.variance).toBe(0.001 + 5 * 1e-5);
  });
});

describe("REQ-001-03 rolling windows in a simulation", () => {
  test("REQ-001-03 too short history yields a message instead of a result", () => {
    const result = runScenario(dataset, scenario, {
      ...global,
      horizonYears: 25,
      sampling: "rolling",
    });
    expect(result.error).toEqual({ kind: "periodShorterThanHorizon", years: expect.any(Number) });
    expect(result.pathCount).toBe(0);
  });
});

describe("REQ-001-14 percentiles", () => {
  test("REQ-001-14 bands are ordered and final percentiles are reported", () => {
    const result = runScenario(dataset, scenario, { ...global, sampling: "bootstrap" });
    expect(result.pathCount).toBe(300);
    expect(result.bands).toHaveLength(61);
    for (const b of result.bands) {
      expect(b.p10).toBeLessThanOrEqual(b.p50);
      expect(b.p50).toBeLessThanOrEqual(b.p90);
    }
    const f = result.final;
    expect(f.p5).toBeLessThanOrEqual(f.p25);
    expect(f.p25).toBeLessThanOrEqual(f.p50);
    expect(f.p50).toBeLessThanOrEqual(f.p95);
    expect(result.invested).toBe(scenario.initialInvestment + 60 * scenario.monthlyContribution);
    expect(result.probabilityOfLoss).toBeGreaterThanOrEqual(0);
  });

  test("REQ-007-01 the final value is reported for every percentile from P1 to P99", () => {
    const result = runScenario(dataset, scenario, { ...global, sampling: "bootstrap" });
    expect(result.distribution).toHaveLength(99);
    for (let i = 1; i < result.distribution.length; i++) {
      expect(result.distribution[i]).toBeGreaterThanOrEqual(result.distribution[i - 1] as number);
    }
    expect(result.distribution[4]).toBe(result.final.p5);
    expect(result.distribution[49]).toBe(result.final.p50);
    expect(result.distribution[94]).toBe(result.final.p95);
  });

  test("REQ-001-15 same seed gives identical results", () => {
    const a = runScenario(dataset, scenario, { ...global, sampling: "bootstrap" });
    const b = runScenario(dataset, scenario, { ...global, sampling: "bootstrap" });
    expect(a.final).toEqual(b.final);
  });
});

describe("REQ-001-20 influence of factors", () => {
  test("REQ-001-20 removing a cost factor never lowers the median and is reported per factor", () => {
    const leveraged = { ...scenario, leveragedShare: 1, leverage: 2 };
    const impact = factorImpact(dataset, leveraged, { ...global, sampling: "bootstrap" });
    expect(impact.factors.map((f) => f.id)).toEqual(["ter", "sofr", "spread", "trading", "taxes"]);
    for (const f of impact.factors) expect(f.cost).toBeGreaterThanOrEqual(0);
    expect(impact.factors.find((f) => f.id === "taxes")?.cost).toBeGreaterThan(0);
    // Factors are identified, not named: the UI translates the IDs (REQ-012-01).
    expect(Object.keys(impact.factors[0] ?? {}).sort()).toEqual(["cost", "id"]);
  });

  test("REQ-001-20 financing factors are skipped without leverage", () => {
    const impact = factorImpact(dataset, scenario, { ...global, sampling: "bootstrap" });
    expect(impact.factors.map((f) => f.id)).toEqual(["ter", "trading", "taxes"]);
  });
});
