import { render, screen } from "@testing-library/react";
import { LeverageExplorer } from "@/features/results/AnalysisCards";
import { defaultShared, initialScenarios, toParams } from "@/features/scenarios/scenario";
import type { Analysis } from "@/simulation/protocol";

const base = initialScenarios()[0];
if (!base) throw new Error("no scenario");
const scenario = { ...base, params: toParams(base.params, defaultShared) };

const analysis = (points: [number, number, number, number][]): Analysis => {
  const pts = points.map(([leverage, p10, p50, p90]) => ({ leverage, p10, p50, p90 }));
  const best = pts.reduce((a, b) => (b.p50 > a.p50 ? b : a));
  return {
    sweep: { points: pts, bestLeverage: best.leverage },
    factors: { baseline: 0, factors: [] },
  };
};

test("REQ-002-04 states the best factor and compares median and bad case with 1×", () => {
  render(
    <LeverageExplorer
      scenario={scenario}
      invested={120_000}
      loading={false}
      analysis={analysis([
        [1, 150_000, 250_000, 400_000],
        [2, 100_000, 400_000, 900_000],
        [3, 60_000, 350_000, 1_200_000],
      ])}
    />,
  );
  const takeaway = screen.getByTestId("leverage-takeaway");
  expect(takeaway).toHaveTextContent(/2\.00× has the highest median/);
  expect(takeaway).toHaveTextContent("€400,000");
  expect(takeaway).toHaveTextContent("€250,000 with 1×");
  expect(takeaway).toHaveTextContent(/bad case \(P10\).*€100,000.*€150,000 with 1×/);
  expect(screen.getByText(/always 100 % in the leveraged ETF/)).toBeInTheDocument();
  const legend = screen.getByRole("list", { name: "Legend" });
  for (const label of [/Median/, /P10/, /P90/, /Paid in/]) {
    expect(legend).toHaveTextContent(label);
  }
});

test("REQ-002-04 says when leverage did not pay off", () => {
  render(
    <LeverageExplorer
      scenario={scenario}
      invested={120_000}
      loading={false}
      analysis={analysis([
        [1, 150_000, 250_000, 400_000],
        [2, 80_000, 200_000, 500_000],
      ])}
    />,
  );
  expect(screen.getByTestId("leverage-takeaway")).toHaveTextContent(
    /1× \(no leverage\) has the highest median/,
  );
});
