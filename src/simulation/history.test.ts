import { grossNetGap, netFromGross } from "@/simulation/history";

describe("REQ-012-02 net returns before 2001", () => {
  test("REQ-012-02 the gap is the average monthly log difference of gross and net returns", () => {
    const gross = [0.02, -0.01, 0.03, 0.005];
    const net = gross.map((g) => (1 + g) * Math.exp(-0.0005) - 1);
    expect(grossNetGap(gross, net)).toBeCloseTo(0.0005, 12);
  });

  test("REQ-012-02 gross returns reduced by the gap match net returns", () => {
    const gross = [0.02, -0.01, 0.03];
    const net = netFromGross(gross, 0.0005);
    net.forEach((n, i) => {
      expect(Math.log1p(gross[i] ?? 0) - Math.log1p(n)).toBeCloseTo(0.0005, 12);
    });
  });

  test("REQ-012-02 only months present in both series count", () => {
    expect(grossNetGap([0.01, 0.02], [0.01])).toBeCloseTo(0, 12);
  });
});
