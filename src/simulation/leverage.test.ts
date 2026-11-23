import { leveragedReturn } from "@/simulation/leverage";

const base = { ter: 0, includeSofr: true, financingSpread: 0 };
const month = { r: 0.02, rate: 0.04, variance: 0.002 };

describe("REQ-001-05 leveraged ETF model", () => {
  test("REQ-001-05 1× equals the index return minus TER", () => {
    expect(leveragedReturn(month, { ...base, leverage: 1, ter: 0 })).toBeCloseTo(0.02, 10);
    expect(leveragedReturn(month, { ...base, leverage: 1, ter: 0.012 })).toBeCloseTo(
      1.02 * Math.exp(-0.001) - 1,
      10,
    );
  });

  test("REQ-001-05 2× applies volatility drag and financing on the borrowed part", () => {
    const x = Math.log(1.02);
    const expected = Math.exp(2 * x - 0.002 - (0.04 + 0.005) / 12 - 0.006 / 12) - 1;
    const actual = leveragedReturn(month, {
      leverage: 2,
      ter: 0.006,
      includeSofr: true,
      financingSpread: 0.005,
    });
    expect(actual).toBeCloseTo(expected, 10);
  });

  test("REQ-001-05 volatility drag grows with variance", () => {
    const calm = leveragedReturn({ ...month, variance: 0.0005 }, { ...base, leverage: 3 });
    const wild = leveragedReturn({ ...month, variance: 0.01 }, { ...base, leverage: 3 });
    expect(wild).toBeLessThan(calm);
  });

  test("REQ-001-05 a daily-reset fund never loses more than 100 %", () => {
    const crash = leveragedReturn(
      { r: -0.3, rate: 0.05, variance: 0.02 },
      { ...base, leverage: 3 },
    );
    expect(crash).toBeGreaterThan(-1);
    expect(crash).toBeLessThan(-0.6);
  });
});

describe("REQ-001-06 SOFR toggle", () => {
  test("REQ-001-06 without SOFR only the spread is charged", () => {
    const params = { leverage: 2, ter: 0, financingSpread: 0.005 };
    const withSofr = leveragedReturn(month, { ...params, includeSofr: true });
    const withoutSofr = leveragedReturn(month, { ...params, includeSofr: false });
    expect(Math.log(1 + withoutSofr) - Math.log(1 + withSofr)).toBeCloseTo(0.04 / 12, 10);
  });
});

describe("REQ-015-02 part of a month", () => {
  test("REQ-015-02 TER and financing are charged pro rata to the part of the month", () => {
    const costs = { leverage: 2, ter: 0.012, includeSofr: true, financingSpread: 0.006 };
    const x = Math.log(1.02);
    const expected = Math.exp(2 * x - 0.002 - ((0.04 + 0.006 + 0.012) / 12) * 0.25) - 1;
    expect(leveragedReturn(month, costs, 0.25)).toBeCloseTo(expected, 10);
  });
});
