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
  expect(screen.getByText(/^(Bull market|Correction|Bear market)$/)).toBeInTheDocument();
  expect(screen.getByText(/(Above|Below) 10-month SMA/)).toBeInTheDocument();
  expect(screen.getByText("Distance from all-time high")).toBeInTheDocument();
});

function pickTab(list: string, name: string | RegExp) {
  const tab = within(screen.getByRole("tablist", { name: list })).getByRole("tab", { name });
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
  return tab;
}

test("REQ-006-01 the chart time frame can be changed, 5 years preselected", async () => {
  renderApp();
  await openMarketAndData();
  const frames = await screen.findByRole("tablist", { name: "Time frame" });
  expect(within(frames).getByRole("tab", { name: "5Y" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText(/last 5 years, start = 100/)).toBeInTheDocument();
  pickTab("Time frame", "10Y");
  expect(screen.getByText(/last 10 years, start = 100/)).toBeInTheDocument();
});

test("REQ-006-01 time frames longer than the history cannot be picked", async () => {
  renderApp();
  await openMarketAndData();
  await screen.findByRole("tablist", { name: "Time frame" });
  expect(screen.getByRole("tab", { name: "50Y" })).toBeEnabled();
  pickTab("Index", "MSCI World");
  expect(screen.getByRole("tab", { name: "50Y" })).toBeDisabled();
});

test("REQ-006-02 time frames over 10 years use a log scale", async () => {
  renderApp();
  await openMarketAndData();
  await screen.findByRole("tablist", { name: "Time frame" });
  expect(screen.queryByText(/log scale/)).not.toBeInTheDocument();
  pickTab("Time frame", "20Y");
  expect(screen.getByText(/log scale/)).toBeInTheDocument();
});

test("REQ-006-03 statistics of the selected time frame are shown", async () => {
  renderApp();
  await openMarketAndData();
  const stats = await screen.findByRole("region", { name: "Selected time frame" });
  for (const label of ["Total return", "CAGR", "Volatility", "Max drawdown"]) {
    expect(within(stats).getByText(label)).toBeInTheDocument();
  }
  const before = stats.textContent;
  pickTab("Time frame", "Max");
  expect(screen.getByRole("region", { name: "Selected time frame" }).textContent).not.toBe(before);
});

test("REQ-006-04 historic bear markets of the time frame are listed", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Bear and bull markets");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  expect(within(card).getByText(/No bear market/)).toBeInTheDocument();
  pickTab("Time frame", "Max");
  const row = within(card).getByRole("row", { name: /1929-08/ });
  expect(within(row).getByText("1932-05")).toBeInTheDocument();
  expect(within(row).getByText("-81.7 %")).toBeInTheDocument();
});

test("REQ-006-04 an ongoing bear market is marked as such", async () => {
  // S&P 500 history cut off at its 2009-02 trough (1871-01 + 1657 months).
  const cutOff = async (id: string) => {
    const d = JSON.parse(raw[id] ?? "null");
    return id === "sp500"
      ? { ...d, returns: d.returns.slice(0, 1658), rates: d.rates.slice(0, 1658) }
      : d;
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App loadDataset={cutOff} simulationClient={idleClient} />
    </QueryClientProvider>,
  );
  await openMarketAndData();
  const heading = await screen.findByText("Bear and bull markets");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  const row = within(card).getByRole("row", { name: /2007-09/ });
  expect(within(row).getByText("ongoing")).toBeInTheDocument();
  expect(within(card).queryByText("Current bull market")).not.toBeInTheDocument();
});

test("REQ-006-05 the current bull market and past bull markets are summarised", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Bear and bull markets");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  expect(within(card).getByText("Current bull market")).toBeInTheDocument();
  expect(within(card).getByText(/since 2009-02/)).toBeInTheDocument();
  expect(within(card).getByText("Median bull market")).toBeInTheDocument();
});

test("REQ-006-06 trailing returns, recent volatility and the short rate are shown", async () => {
  renderApp();
  await openMarketAndData();
  const indicators = await screen.findByRole("region", { name: "Key indicators" });
  for (const label of [
    "1Y",
    "3Y p.a.",
    "5Y p.a.",
    "10Y p.a.",
    "Volatility 12 months",
    "Short rate",
  ]) {
    expect(within(indicators).getByText(label)).toBeInTheDocument();
  }
  expect(within(indicators).getByText(/long-term 14.0 %/)).toBeInTheDocument();
  expect(within(indicators).getByText("3.7 %")).toBeInTheDocument();
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
  const card = (await screen.findByText(/Final value after taxes — percentiles/)).closest(
    "[data-slot=card]",
  ) as HTMLElement;
  const table = within(card).getByRole("table");
  expect(await within(table).findAllByLabelText("Best")).toHaveLength(6);
  const rows = within(table).getAllByRole("row");
  // The third scenario has the highest values.
  expect(within(rows[3] as HTMLElement).getAllByLabelText("Best")).toHaveLength(6);
  // The cards for small screens mark the same scenario.
  const thirdCard = within(card).getByRole("article", { name: "2× with 10-month SMA" });
  expect(within(thirdCard).getAllByLabelText("Best")).toHaveLength(6);
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

const fakeResult = () => ({
  pathCount: 10,
  period: "",
  bands: [{ p10: 1, p25: 2, p50: 3, p75: 4, p90: 5 }],
  final: { p5: 1, p10: 2, p25: 3, p50: 4, p75: 5, p95: 6 },
  invested: 1,
  probabilityOfLoss: 0,
  medianFees: 0,
  medianTaxes: 0,
});

function resolvingClient() {
  const calls: { key: string }[][] = [];
  const client = {
    run: (jobs: { key: string }[]) => {
      calls.push(jobs);
      return Promise.resolve(Object.fromEntries(jobs.map((j) => [j.key, fakeResult()])));
    },
    analyze: () => new Promise(() => {}),
  } as unknown as Pick<SimulationClient, "run" | "analyze">;
  return { client, calls };
}

async function resultsCard() {
  return (await screen.findByText(/Final value after taxes — percentiles/)).closest(
    "[data-slot=card]",
  ) as HTMLElement;
}

test("REQ-004-01 hidden scenarios leave the chart and the results table", async () => {
  const { client, calls } = resolvingClient();
  renderApp(client);
  const legend = await screen.findByRole("list", { name: "Legend" });
  await within(legend).findByText("2× buy and hold");

  const toggle = screen.getByRole("button", { name: "Show 2× buy and hold" });
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-pressed", "false");

  await vi.waitFor(() => expect(calls.at(-1)?.map((j) => j.key)).toEqual(["s1", "s3"]));
  await vi.waitFor(() =>
    expect(within(legend).queryByText("2× buy and hold")).not.toBeInTheDocument(),
  );
  const card = await resultsCard();
  expect(within(card).queryByRole("article", { name: "2× buy and hold" })).not.toBeInTheDocument();
  expect(within(card).getByRole("article", { name: "1× buy and hold" })).toBeInTheDocument();

  // Still in the scenario bar and editable.
  const tabs = screen.getByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  expect(screen.getByLabelText("Name")).toHaveValue("2× buy and hold");
});

test("REQ-004-02 a hidden scenario can be shown again", async () => {
  const { client, calls } = resolvingClient();
  renderApp(client);
  const legend = await screen.findByRole("list", { name: "Legend" });
  const toggle = await screen.findByRole("button", { name: "Show 1× buy and hold" });
  fireEvent.click(toggle);
  await vi.waitFor(() => expect(calls.at(-1)?.map((j) => j.key)).toEqual(["s2", "s3"]));
  fireEvent.click(toggle);
  await vi.waitFor(() => expect(calls.at(-1)?.map((j) => j.key)).toEqual(["s1", "s2", "s3"]));
  await within(legend).findByText("1× buy and hold");
});

test("REQ-004-03 hidden scenarios stay hidden after a reload", async () => {
  const first = renderApp();
  fireEvent.click(await screen.findByRole("button", { name: "Show 2× buy and hold" }));
  first.unmount();
  renderApp();
  expect(await screen.findByRole("button", { name: "Show 2× buy and hold" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByRole("button", { name: "Show 1× buy and hold" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

const tabNames = () =>
  within(screen.getByRole("tablist", { name: "Scenarios" }))
    .getAllByRole("tab")
    .map((t) => t.textContent);

test("REQ-005-01 dragging a tab onto another moves it there", async () => {
  renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  const third = within(tabs).getByRole("tab", { name: /2× with 10-month SMA/ });
  const first = within(tabs).getByRole("tab", { name: /1× buy and hold/ });
  const dataTransfer = { setData: () => {}, getData: () => "", effectAllowed: "", dropEffect: "" };
  fireEvent.dragStart(third, { dataTransfer });
  fireEvent.dragOver(first, { dataTransfer });
  fireEvent.drop(first, { dataTransfer });
  fireEvent.dragEnd(third, { dataTransfer });
  expect(tabNames()).toEqual(["2× with 10-month SMA", "1× buy and hold", "2× buy and hold"]);
});

test("REQ-005-02 move buttons swap the selected scenario with its neighbour", async () => {
  renderApp();
  const left = await screen.findByRole("button", { name: "Move left" });
  const right = screen.getByRole("button", { name: "Move right" });
  expect(left).toBeDisabled();
  fireEvent.click(right);
  expect(tabNames()).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]);
  const tabs = screen.getByRole("tablist", { name: "Scenarios" });
  expect(within(tabs).getByRole("tab", { selected: true })).toHaveTextContent("1× buy and hold");
  fireEvent.click(right);
  expect(right).toBeDisabled();
  fireEvent.click(left);
  expect(tabNames()).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]);
});

test("REQ-005-03 legend and results table follow the scenario order", async () => {
  const { client } = resolvingClient();
  renderApp(client);
  const legend = await screen.findByRole("list", { name: "Legend" });
  await within(legend).findByText("2× buy and hold");
  fireEvent.click(screen.getByRole("button", { name: "Move right" }));
  await vi.waitFor(() =>
    expect(
      within(legend)
        .getAllByRole("listitem")
        .slice(0, 3)
        .map((li) => li.textContent),
    ).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]),
  );
  const card = await resultsCard();
  await vi.waitFor(() =>
    expect(
      within(card)
        .getAllByRole("article")
        .map((a) => within(a).getByRole("heading").textContent),
    ).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]),
  );
});

test("REQ-005-03 the order survives a reload", async () => {
  const first = renderApp();
  fireEvent.click(await screen.findByRole("button", { name: "Move right" }));
  first.unmount();
  renderApp();
  await screen.findByRole("tablist", { name: "Scenarios" });
  expect(tabNames()).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]);
});

test("REQ-007-01 a chart plots the final value against the percentile for every scenario", async () => {
  const { client } = resolvingClient();
  renderApp(client);
  const card = await resultsCard();
  const chart = within(card).getByRole("img", { name: /Final value after taxes by percentile/ });
  expect(chart).toBeInTheDocument();
  const legend = within(card).getByRole("list", { name: "Percentile chart legend" });
  await vi.waitFor(() =>
    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["1× buy and hold", "2× buy and hold", "2× with 10-month SMA", "Paid in"]),
  );
});

test("REQ-007-02 percentiles can be shown as yearly return", async () => {
  const { client } = resolvingClient();
  renderApp(client);
  const card = await resultsCard();
  const table = within(card).getByRole("table");
  const p50 = () =>
    within(within(table).getAllByRole("row")[1] as HTMLElement).getAllByRole("cell")[4];
  await vi.waitFor(() => expect(p50()).toHaveTextContent("€4"));

  const unit = within(card).getByRole("group", { name: "Unit" });
  expect(within(unit).getByRole("button", { name: "€" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(within(unit).getByRole("button", { name: "% p.a." }));
  expect(within(unit).getByRole("button", { name: "% p.a." })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(p50()).toHaveTextContent(/^-?\d+\.\d %$/);
  expect(
    within(card).getByRole("img", { name: /yearly return by percentile/i }),
  ).toBeInTheDocument();
  const firstCard = within(card).getByRole("article", { name: "1× buy and hold" });
  expect(within(firstCard).getAllByText(/^-?\d+\.\d %$/).length).toBeGreaterThanOrEqual(6);

  fireEvent.click(within(unit).getByRole("button", { name: "€" }));
  expect(p50()).toHaveTextContent("€4");
});
