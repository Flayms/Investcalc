import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "@/App";
import type { SimulationClient } from "@/features/simulation/client";

import msciAcwi from "../public/data/msci-acwi.json?raw";
import msciWorld from "../public/data/msci-world.json?raw";
import sp500 from "../public/data/sp500.json?raw";

const raw: Record<string, string> = { sp500, "msci-world": msciWorld, "msci-acwi": msciAcwi };
const loadDataset = async (id: string) => JSON.parse(raw[id] ?? "null");

/** Simulations are covered by engine tests; here they never finish so the UI stays cheap. */
const idleClient = {
  run: () => new Promise(() => {}),
  analyze: () => new Promise(() => {}),
} as unknown as Pick<SimulationClient, "run" | "analyze">;

beforeEach(() => localStorage.clear());

function renderApp(simulationClient: Pick<SimulationClient, "run" | "analyze"> = idleClient) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <App loadDataset={loadDataset} simulationClient={simulationClient} />
    </QueryClientProvider>,
  );
}

async function openMarketAndData() {
  const views = await screen.findByRole("tablist", { name: "Views" });
  const tab = within(views).getByRole("tab", { name: "Market & data" });
  // Radix tabs activate on mousedown.
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
}

test("renders the app title", async () => {
  renderApp();
  expect(screen.getByRole("heading", { name: "Investcalc" })).toBeInTheDocument();
});

test("REQ-001-01 the data basis lists all three indices with period, CAGR and volatility", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Data basis");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  const table = within(card).getByRole("table");
  for (const name of ["S&P 500", "MSCI World", "MSCI ACWI (All World)"]) {
    expect(within(table).getByText(name)).toBeInTheDocument();
  }
  expect(within(table).getByText(/1871-01 –/)).toBeInTheDocument();
  expect(within(table).getAllByText(/%$/).length).toBeGreaterThanOrEqual(6);
});

test("REQ-001-15 scenarios can be duplicated, renamed and removed", async () => {
  renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  expect(within(tabs).getAllByRole("tab")).toHaveLength(3);

  fireEvent.click(screen.getByRole("button", { name: /Duplicate/ }));
  expect(within(tabs).getAllByRole("tab")).toHaveLength(4);
  expect(within(tabs).getByRole("tab", { selected: true })).toHaveTextContent(
    "1× buy and hold (copy)",
  );

  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "My plan" } });
  expect(within(tabs).getByRole("tab", { selected: true })).toHaveTextContent("My plan");

  fireEvent.click(screen.getByRole("button", { name: "Remove scenario" }));
  expect(within(tabs).getAllByRole("tab")).toHaveLength(3);
  expect(within(tabs).queryByText("My plan")).not.toBeInTheDocument();
});

test("REQ-001-17 every setting has help and deviations from the recommendation are flagged", async () => {
  renderApp();
  await screen.findByText("Scenario settings");
  for (const label of [
    "Monthly investment",
    "TER 1× ETF",
    "Order fee",
    "Bid-ask spread",
    "Apply German taxes",
  ]) {
    expect(screen.getByRole("button", { name: `About ${label}` })).toBeInTheDocument();
  }
  expect(screen.queryByText("Not recommended")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "Apply German taxes" }));
  expect(screen.getByText("Not recommended")).toBeInTheDocument();
});

test("REQ-001-06 the SOFR switch is flagged when switched off", async () => {
  renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  fireEvent.click(screen.getByRole("switch", { name: "Include SOFR financing" }));
  expect(screen.getByText("Not recommended")).toBeInTheDocument();
});

test("REQ-001-18 the current market phase and SMA position are shown", async () => {
  renderApp();
  await openMarketAndData();
  await screen.findByText("Current market");
  expect(screen.getByText(/Bull market|Correction|Bear market/)).toBeInTheDocument();
  expect(screen.getByText(/(Above|Below) 10-month SMA/)).toBeInTheDocument();
  expect(screen.getByText("Distance from all-time high")).toBeInTheDocument();
});

test("REQ-002-01 scenarios, selection and settings are restored after a reload", async () => {
  const first = renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  fireEvent.click(screen.getByRole("button", { name: /Duplicate/ }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Saved plan" } });
  fireEvent.click(screen.getByRole("switch", { name: "Apply German taxes" }));
  expect(within(tabs).getAllByRole("tab")).toHaveLength(4);
  first.unmount();

  renderApp();
  const restored = await screen.findByRole("tablist", { name: "Scenarios" });
  expect(within(restored).getAllByRole("tab")).toHaveLength(4);
  expect(within(restored).getByRole("tab", { selected: true })).toHaveTextContent("Saved plan");
  expect(screen.getByRole("switch", { name: "Apply German taxes" })).not.toBeChecked();
});

test("REQ-002-01 corrupt saved state falls back to the default scenarios", async () => {
  localStorage.setItem("investcalc:state", "{broken");
  renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  expect(within(tabs).getAllByRole("tab")).toHaveLength(3);
});

test("REQ-002-02 shared settings are edited once and apply to all scenarios", async () => {
  const calls: { scenario: Record<string, unknown> }[][] = [];
  const recording = {
    run: (jobs: { scenario: Record<string, unknown> }[]) => {
      calls.push(jobs);
      return new Promise(() => {});
    },
    analyze: () => new Promise(() => {}),
  } as unknown as Pick<SimulationClient, "run" | "analyze">;
  renderApp(recording);
  const editor = (await screen.findByText("Scenario settings")).closest(
    "[data-slot=card]",
  ) as HTMLElement;
  for (const label of ["TER 1× ETF", "Order fee", "Bid-ask spread", "Apply German taxes"]) {
    expect(within(editor).queryByText(label)).not.toBeInTheDocument();
  }
  expect(within(editor).queryByText("Historical period")).not.toBeInTheDocument();
  const shared = screen.getByText("Costs & taxes").closest("[data-slot=card]") as HTMLElement;
  expect(within(shared).getByText(/Shared by all scenarios/)).toBeInTheDocument();

  fireEvent.click(within(shared).getByRole("switch", { name: "Apply German taxes" }));
  await vi.waitFor(() => {
    const last = calls.at(-1);
    expect(last).toHaveLength(3);
    for (const job of last ?? []) expect(job.scenario.taxesEnabled).toBe(false);
  });
});

test("REQ-002-03 the best final value of each percentile is marked", async () => {
  const result = (scale: number) => ({
    pathCount: 10,
    period: "",
    bands: [],
    final: {
      p5: 1 * scale,
      p10: 2 * scale,
      p25: 3 * scale,
      p50: 4 * scale,
      p75: 5 * scale,
      p95: 6 * scale,
    },
    invested: 1,
    probabilityOfLoss: 0,
    medianFees: 0,
    medianTaxes: 0,
  });
  const client = {
    run: (jobs: { key: string }[]) =>
      Promise.resolve(Object.fromEntries(jobs.map((j, i) => [j.key, result(1000 * (i + 1))]))),
    analyze: () => new Promise(() => {}),
  } as unknown as Pick<SimulationClient, "run" | "analyze">;
  renderApp(client);
  const table = (await screen.findByText(/Final value after taxes — percentiles/)).closest(
    "[data-slot=card]",
  ) as HTMLElement;
  const best = await within(table).findAllByLabelText("Best");
  expect(best).toHaveLength(6);
  const rows = within(table).getAllByRole("row");
  // The third scenario has the highest values.
  expect(within(rows[3] as HTMLElement).getAllByLabelText("Best")).toHaveLength(6);
});

test("REQ-002-05 market and data basis are on their own view, not among the results", async () => {
  renderApp();
  await screen.findByText("Scenario settings");
  expect(screen.queryByText("Current market")).not.toBeInTheDocument();
  expect(screen.queryByText("Data basis")).not.toBeInTheDocument();
  await openMarketAndData();
  expect(await screen.findByText("Current market")).toBeInTheDocument();
  expect(screen.getByText("Data basis")).toBeInTheDocument();
  expect(screen.queryByText("Scenario settings")).not.toBeInTheDocument();
});
