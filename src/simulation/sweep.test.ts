import type { Dataset } from "@/simulation/dataset";
import { defaultGlobal, defaultScenario } from "@/simulation/params";
import { bestPoint, SWEEP_VALUES, type SweepPoint, sweepParameter } from "@/simulation/sweep";

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
};
const scenario = { ...defaultScenario, etfId: "test", fromYear: 2000, toYear: 2019 };
const global = { ...defaultGlobal, horizonYears: 5, paths: 200, sampling: "bootstrap" as const };

describe("REQ-008-01 sweep of a slider", () => {
  test("REQ-008-01 covers the slider range and reports the distribution and chance of loss", () => {
    const leveraged = { ...scenario, leveragedShare: 0.5, leverage: 2 };
    for (const param of ["leveragedShare", "leverage", "smaMonths"] as const) {
      const sweep = sweepParameter(dataset, leveraged, global, param);
      expect(sweep.param).toBe(param);
      expect(sweep.points.map((p) => p.value)).toEqual(SWEEP_VALUES[param]);
      for (const p of sweep.points) {
        expect(p.p5).toBeLessThanOrEqual(p.p10);
        expect(p.p10).toBeLessThanOrEqual(p.p25);
        expect(p.p25).toBeLessThanOrEqual(p.p50);
        expect(p.p50).toBeLessThanOrEqual(p.p75);
        expect(p.p75).toBeLessThanOrEqual(p.p90);
        expect(p.p90).toBeLessThanOrEqual(p.p95);
        expect(p.lossProbability).toBeGreaterThanOrEqual(0);
        expect(p.lossProbability).toBeLessThanOrEqual(1);
      }
      expect(sweep.invested).toBeGreaterThan(0);
    }
    expect(SWEEP_VALUES.leveragedShare[0]).toBe(0);
    expect(SWEEP_VALUES.leveragedShare.at(-1)).toBe(1);
    expect(SWEEP_VALUES.leverage[0]).toBe(1);
    expect(SWEEP_VALUES.leverage.at(-1)).toBe(3);
    expect(SWEEP_VALUES.smaMonths).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test("REQ-008-01 the swept value of the scenario matches a plain simulation of it", () => {
    const leveraged = { ...scenario, leveragedShare: 1, leverage: 2 };
    const sweep = sweepParameter(dataset, leveraged, global, "leverage");
    const at1 = sweep.points.find((p) => p.value === 1);
    const unleveraged = sweepParameter(dataset, { ...leveraged, leverage: 1 }, global, "leverage");
    expect(unleveraged.points.find((p) => p.value === 1)).toEqual(at1);
  });

  test("REQ-008-01 a too short history yields an error", () => {
    const sweep = sweepParameter(
      dataset,
      scenario,
      { ...global, sampling: "rolling", horizonYears: 25 },
      "leverage",
    );
    expect(sweep.error).toMatch(/shorter than/);
    expect(sweep.points).toEqual([]);
  });
});

describe("REQ-008-02 sweeps that need another setting", () => {
  test("REQ-008-02 leverage without leveraged share assumes 100 % leveraged", () => {
    expect(sweepParameter(dataset, scenario, global, "leverage").assumed).toEqual({
      leveragedShare: 1,
    });
    const withShare = { ...scenario, leveragedShare: 0.5 };
    expect(sweepParameter(dataset, withShare, global, "leverage").assumed).toEqual({});
  });

  test("REQ-008-02 share with a 1× factor assumes 2×", () => {
    const sweep = sweepParameter(dataset, { ...scenario, leverage: 1 }, global, "leveragedShare");
    expect(sweep.assumed).toEqual({ leverage: 2 });
    const first = sweep.points[0];
    const last = sweep.points.at(-1);
    expect(first?.p50).not.toEqual(last?.p50);
  });

  test("REQ-008-02 SMA window with buy and hold assumes SMA and shows buy and hold as reference", () => {
    const sweep = sweepParameter(dataset, scenario, global, "smaMonths");
    expect(sweep.assumed).toEqual({ strategy: "sma" });
    expect(sweep.reference?.label).toBe("Buy and hold");
    expect(sweep.reference?.point.p50).toBeGreaterThan(0);
  });
});

const point = (value: number, p10: number, p50: number, lossProbability: number): SweepPoint => ({
  value,
  p5: p10,
  p10,
  p25: p50,
  p50,
  p75: p50,
  p90: p50,
  p95: p50,
  lossProbability,
});

describe("REQ-008-03 choosing what best means", () => {
  const points = [point(1, 100, 200, 0.05), point(2, 80, 300, 0.1), point(3, 50, 250, 0.05)];
  test("REQ-008-03 each goal picks its own best value", () => {
    expect(bestPoint(points, "median")?.value).toBe(2);
    expect(bestPoint(points, "badCase")?.value).toBe(1);
  });
  test("REQ-008-03 ties are resolved by the higher median", () => {
    expect(bestPoint(points, "loss")?.value).toBe(3);
  });
  test("REQ-008-03 no points, no best value", () => {
    expect(bestPoint([], "median")).toBeUndefined();
  });
});
