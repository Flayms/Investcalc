import type { Dataset } from "@/simulation/dataset";
import { marketStatus } from "@/simulation/market";

const dataset = (returns: number[]): Dataset => ({
  id: "x",
  name: "X",
  description: "",
  source: "",
  currency: "USD",
  priceType: "close",
  start: "2000-01",
  returns,
  rates: returns.map(() => 0.02),
});

describe("REQ-001-18 market status", () => {
  test("REQ-001-18 steady growth is a bull market above all SMAs", () => {
    const status = marketStatus(dataset(Array(24).fill(0.01)));
    expect(status.phase).toBe("bull");
    expect(status.lastMonth).toBe("2001-12");
    expect(status.drawdown).toBeCloseTo(0, 10);
    expect(status.smas.every((s) => s.above)).toBe(true);
  });

  test("REQ-001-18 a 25 % drop from the high is a bear market below its SMAs", () => {
    const status = marketStatus(dataset([...Array(24).fill(0.01), -0.25]));
    expect(status.phase).toBe("bear");
    expect(status.drawdown).toBeCloseTo(-0.25, 10);
    expect(status.smas.every((s) => !s.above)).toBe(true);
  });

  test("REQ-001-18 a 12 % drop is a correction", () => {
    expect(marketStatus(dataset([...Array(24).fill(0.01), -0.12])).phase).toBe("correction");
  });
});
