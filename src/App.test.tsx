import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "@/App";
import { browserStorage, saveState } from "@/features/persistence/persistence";
import { defaultShared, initialScenarios } from "@/features/scenarios/scenario";
import type { SimulationApi } from "@/features/simulation/client";
import { defaultGlobal } from "@/simulation/params";
import { SWEEP_VALUES, type SweepParam } from "@/simulation/sweep";
import eur from "../public/data/eur.json?raw";
import msciAcwi from "../public/data/msci-acwi.json?raw";
import msciWorld from "../public/data/msci-world.json?raw";
import sp500 from "../public/data/sp500.json?raw";
import usMarket from "../public/data/us-market.json?raw";

const raw: Record<string, string> = {
  sp500,
  "us-market": usMarket,
  "msci-world": msciWorld,
  "msci-acwi": msciAcwi,
  eur,
};
const loadDataset = async (id: string) => JSON.parse(raw[id] ?? "null");

/** Simulations are covered by engine tests; here they never finish so the UI stays cheap. */
const idleClient = {
  run: () => new Promise(() => {}),
  sweep: () => new Promise(() => {}),
  factors: () => new Promise(() => {}),
} as unknown as SimulationApi;

beforeEach(() => localStorage.clear());

function renderApp(simulationClient: SimulationApi = idleClient) {
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

test("REQ-001-01 the data basis lists all indices with period, CAGR and volatility", async () => {
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

test("REQ-011-01 scenarios are simulated in euros by default", async () => {
  renderApp();
  const currency = await screen.findByRole("combobox", { name: "Currency" });
  expect(currency).toHaveTextContent("Euro");
});

test("REQ-011-04 the historical period says from when the history in euros starts", async () => {
  renderApp();
  expect(await screen.findByText(/In euros from 1960/)).toBeInTheDocument();
});

test("REQ-011-07 the data basis names the exchange rate and euro short rate sources", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Data basis");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  expect(within(card).getByText(/Bundesbank/)).toBeInTheDocument();
  expect(within(card).getByText(/ECB/)).toBeInTheDocument();
  expect(within(card).getByText(/3-month money market rate/)).toBeInTheDocument();
});

test("REQ-010-03 the data basis lists the US total market from 1926-07", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Data basis");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  const row = within(within(card).getByRole("table")).getByRole("row", {
    name: /^US total market/,
  });
  expect(within(row).getByText(/^1926-07 –/)).toBeInTheDocument();
});

test("REQ-010-02 the data basis states from which month daily data is used", async () => {
  renderApp();
  await openMarketAndData();
  const heading = await screen.findByText("Data basis");
  const card = heading.closest("[data-slot=card]") as HTMLElement;
  const table = within(card).getByRole("table");
  expect(within(table).getByRole("columnheader", { name: "Daily data from" })).toBeInTheDocument();
  const sp = within(table).getByRole("row", { name: /^S&P 500/ });
  expect(within(sp).getByText("1926-07")).toBeInTheDocument();
  const world = within(table).getByRole("row", { name: /^MSCI World/ });
  expect(within(world).getByText("2001-01")).toBeInTheDocument();
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
      ? {
          ...d,
          returns: d.returns.slice(0, 1658),
          rates: d.rates.slice(0, 1658),
          variance: d.variance.slice(0, 1658),
        }
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
    sweep: () => new Promise(() => {}),
    factors: () => new Promise(() => {}),
  } as unknown as SimulationApi;
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
    sweep: () => new Promise(() => {}),
    factors: () => new Promise(() => {}),
  } as unknown as SimulationApi;
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
    sweep: () => new Promise(() => {}),
    factors: () => new Promise(() => {}),
  } as unknown as SimulationApi;
  return { client, calls };
}

async function resultsCard(title = /Final value after taxes — percentiles/) {
  return (await screen.findByText(title)).closest("[data-slot=card]") as HTMLElement;
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

  await vi.waitFor(() =>
    expect(within(legend).queryByText("2× buy and hold")).not.toBeInTheDocument(),
  );
  // No hidden scenario is simulated.
  for (const jobs of calls.slice(1)) expect(jobs.map((j) => j.key)).not.toContain("s2");
  const card = await resultsCard();
  expect(within(card).queryByRole("article", { name: "2× buy and hold" })).not.toBeInTheDocument();
  expect(within(card).getByRole("article", { name: "1× buy and hold" })).toBeInTheDocument();

  // Still in the scenario bar and editable.
  const tabs = screen.getByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  expect(screen.getByLabelText("Name")).toHaveValue("2× buy and hold");
});

test("REQ-004-02 a hidden scenario can be shown again", async () => {
  const { client } = resolvingClient();
  renderApp(client);
  const legend = await screen.findByRole("list", { name: "Legend" });
  const toggle = await screen.findByRole("button", { name: "Show 1× buy and hold" });
  await within(legend).findByText("1× buy and hold");
  fireEvent.click(toggle);
  await vi.waitFor(() =>
    expect(within(legend).queryByText("1× buy and hold")).not.toBeInTheDocument(),
  );
  fireEvent.click(toggle);
  await within(legend).findByText("1× buy and hold");
  const card = await resultsCard();
  expect(within(card).getByRole("article", { name: "1× buy and hold" })).toBeInTheDocument();
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

test("REQ-005-02 / REQ-005-04 there are no move buttons; each tab has a drag handle", async () => {
  renderApp();
  await screen.findByRole("tablist", { name: "Scenarios" });
  expect(screen.queryByRole("button", { name: "Move left" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Move right" })).not.toBeInTheDocument();
  const handle = screen.getByRole("button", { name: "Reorder 2× buy and hold" });
  expect(handle).toHaveAttribute("aria-roledescription", "sortable");
  expect(handle).toHaveAttribute("tabindex", "0");
});

test("REQ-005-05 clicking a tab selects it and moves nothing", async () => {
  renderApp();
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  const second = within(tabs).getByRole("tab", { name: /2× buy and hold/ });
  fireEvent.mouseDown(second);
  fireEvent.mouseUp(second);
  fireEvent.click(second);
  expect(second).toHaveAttribute("aria-selected", "true");
  expect(tabNames()).toEqual(["1× buy and hold", "2× buy and hold", "2× with 10-month SMA"]);
});

test("REQ-005-03 legend and results table follow the scenario order", async () => {
  const [s1, s2, s3] = initialScenarios();
  if (!s1 || !s2 || !s3) throw new Error("no scenarios");
  saveState(browserStorage(), {
    scenarios: [s2, s1, s3],
    selectedKey: "s1",
    global: defaultGlobal,
    shared: defaultShared,
  });
  const { client } = resolvingClient();
  renderApp(client);
  await screen.findByRole("tablist", { name: "Scenarios" });
  expect(tabNames()).toEqual(["2× buy and hold", "1× buy and hold", "2× with 10-month SMA"]);
  const legend = await screen.findByRole("list", { name: "Legend" });
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

/** Sweeps whose median peaks at the given value of each slider. */
function sweepingClient(peaks: Record<SweepParam, number>) {
  const sweepCalls: { param: SweepParam; scenario: Record<string, unknown> }[] = [];
  const client = {
    run: (jobs: { key: string }[]) =>
      Promise.resolve(Object.fromEntries(jobs.map((j) => [j.key, fakeResult()]))),
    sweep: (_d: unknown, scenario: Record<string, unknown>, _g: unknown, param: SweepParam) => {
      sweepCalls.push({ param, scenario });
      const points = SWEEP_VALUES[param].map((value) => {
        const p50 = 1000 - Math.abs(value - peaks[param]) * 100;
        return {
          value,
          p5: p50 / 4,
          p10: p50 / 2,
          p25: p50 * 0.8,
          p50,
          p75: p50 * 1.2,
          p90: p50 * 1.5,
          p95: p50 * 2,
          lossProbability: value / 100,
        };
      });
      return Promise.resolve({ param, points, invested: 500, assumed: {} });
    },
    factors: () => new Promise(() => {}),
  } as unknown as SimulationApi;
  return { client, sweepCalls };
}

const leverageSlider = () => screen.getByRole("slider", { name: "Leverage factor" });

test("REQ-008-05 explored sliders show their goal curve and apply the best value", async () => {
  const { client } = sweepingClient({ leveragedShare: 0.5, leverage: 2.5, smaMonths: 8 });
  renderApp(client);
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  const insight = await screen.findByTestId("insight-leverage");
  expect(
    await within(insight).findByRole("img", {
      name: "Median by Leverage factor; best at 2.50×",
    }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("insight-leveragedShare")).toBeInTheDocument();
  // SMA window is hidden for buy and hold, so it has no insight here.
  expect(screen.queryByTestId("insight-smaMonths")).not.toBeInTheDocument();
  // Monthly investment is not explored.
  expect(screen.getAllByTestId(/^insight-/)).toHaveLength(2);

  expect(leverageSlider()).toHaveAttribute("aria-valuenow", "2");
  fireEvent.click(within(insight).getByRole("button", { name: "Use 2.50×" }));
  expect(leverageSlider()).toHaveAttribute("aria-valuenow", "2.5");
});

test("REQ-008-05 Explore opens the slider's diagram in the explorer", async () => {
  const { client } = sweepingClient({ leveragedShare: 0.5, leverage: 2.5, smaMonths: 8 });
  renderApp(client);
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  const explorer = screen.getByText(/Value explorer/).closest("[data-slot=card]") as HTMLElement;
  const sliders = within(explorer).getByRole("tablist", { name: "Explored slider" });
  // Tabs carry the sliders' own labels.
  expect(
    within(sliders)
      .getAllByRole("tab")
      .map((t) => t.textContent),
  ).toEqual(["Share in leveraged ETF", "Leverage factor", "SMA window"]);
  fireEvent.click(
    within(await screen.findByTestId("insight-leveragedShare")).getByRole("button", {
      name: "Explore Share in leveraged ETF",
    }),
  );
  expect(within(sliders).getByRole("tab", { selected: true })).toHaveTextContent(
    "Share in leveraged ETF",
  );
  expect(
    await within(explorer).findByRole("img", {
      name: "Final value after taxes by Share in leveraged ETF",
    }),
  ).toBeInTheDocument();
});

test("REQ-008-03 the goal applies to the explorer and the slider curves", async () => {
  const { client } = sweepingClient({ leveragedShare: 0.5, leverage: 2.5, smaMonths: 8 });
  renderApp(client);
  const tabs = await screen.findByRole("tablist", { name: "Scenarios" });
  fireEvent.click(within(tabs).getByRole("tab", { name: /2× buy and hold/ }));
  const explorer = screen.getByText(/Value explorer/).closest("[data-slot=card]") as HTMLElement;
  expect(await within(explorer).findByTestId("explorer-takeaway")).toHaveTextContent(
    /2\.50× has the highest median/,
  );
  const goals = within(explorer).getByRole("group", { name: "Optimise for" });
  fireEvent.click(within(goals).getByRole("button", { name: "Chance of loss" }));
  // Chance of loss grows with the value in the fake sweep, so the lowest factor wins.
  expect(within(explorer).getByTestId("explorer-takeaway")).toHaveTextContent(
    /1\.00× has the lowest chance of loss/,
  );
  expect(
    within(screen.getByTestId("insight-leverage")).getByRole("img", {
      name: "Chance of loss by Leverage factor; best at 1.00×",
    }),
  ).toBeInTheDocument();
});

test("REQ-008-04 the explorer switches between distribution and trade-off diagrams", async () => {
  const { client } = sweepingClient({ leveragedShare: 0.5, leverage: 2.5, smaMonths: 8 });
  renderApp(client);
  const explorer = (await screen.findByText(/Value explorer/)).closest(
    "[data-slot=card]",
  ) as HTMLElement;
  await within(explorer).findByRole("img", { name: /Final value after taxes by/ });
  const legend = within(explorer).getByRole("list", { name: "Legend" });
  for (const label of [/Median/, /P5–P95/, /P10–P90/, /P25–P75/, /Paid in/])
    expect(legend).toHaveTextContent(label);
  fireEvent.click(within(explorer).getByRole("button", { name: "Trade-off" }));
  expect(
    within(explorer).getByRole("img", { name: /Median against chance of loss by/ }),
  ).toBeInTheDocument();
});

test("REQ-009-01 a status that stays in view says what is running", async () => {
  renderApp();
  await screen.findByRole("tablist", { name: "Scenarios" });
  const status = await vi.waitFor(() => {
    const s = screen
      .getAllByRole("status")
      .find((el) => /Simulating 3 scenarios/.test(el.textContent ?? ""));
    if (!s) throw new Error("no status");
    return s;
  });
  expect(status.className).toMatch(/fixed/);
});

test("REQ-009-01 the status disappears when everything is up to date", async () => {
  const { client } = sweepingClient({ leveragedShare: 0.5, leverage: 2.5, smaMonths: 8 });
  const done = { ...client, factors: () => Promise.resolve({ baseline: 1, factors: [] }) };
  renderApp(done as unknown as SimulationApi);
  await screen.findByTestId("explorer-takeaway");
  await vi.waitFor(() =>
    expect(
      screen.getAllByRole("status").some((el) => /Simulating|Analysing/.test(el.textContent ?? "")),
    ).toBe(false),
  );
});

test("REQ-009-02 results stay visible but marked while they are recalculated", async () => {
  let release: () => void = () => {};
  let calls = 0;
  const client = {
    run: (jobs: { key: string }[]) => {
      calls++;
      const value = Object.fromEntries(jobs.map((j) => [j.key, fakeResult()]));
      if (calls === 1) return Promise.resolve(value);
      return new Promise((resolve) => {
        release = () => resolve(value);
      });
    },
    sweep: () => new Promise(() => {}),
    factors: () => new Promise(() => {}),
  } as unknown as SimulationApi;
  renderApp(client);
  const card = await resultsCard();
  await within(card).findAllByRole("article");
  await vi.waitFor(() => expect(within(card).queryByText("Updating")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("switch", { name: "Apply German taxes" }));
  expect(await within(card).findByText("Updating")).toBeInTheDocument();
  expect(card.querySelector("[aria-busy=true]")).not.toBeNull();
  // The previous results are still there.
  expect(within(card).getAllByRole("article")).toHaveLength(3);
  await vi.waitFor(() => expect(calls).toBe(2));
  release();
  await vi.waitFor(() => expect(within(card).queryByText("Updating")).not.toBeInTheDocument());
});

/** Records every request; runs and analyses resolve, except runs after `hangAfter` calls. */
function recordingClient(hangAfter = Number.POSITIVE_INFINITY) {
  const runs: string[][] = [];
  const sweeps: SweepParam[] = [];
  let factors = 0;
  const client = {
    run: (jobs: { key: string }[]) => {
      runs.push(jobs.map((j) => j.key));
      if (runs.length > hangAfter) return new Promise(() => {});
      return Promise.resolve(Object.fromEntries(jobs.map((j) => [j.key, fakeResult()])));
    },
    sweep: (_d: unknown, _s: unknown, _g: unknown, param: SweepParam) => {
      sweeps.push(param);
      const points = SWEEP_VALUES[param].map((value) => ({
        value,
        p5: 1,
        p10: 2,
        p25: 3,
        p50: 4,
        p75: 5,
        p90: 6,
        p95: 7,
        lossProbability: 0,
      }));
      return Promise.resolve({ param, points, invested: 1, assumed: {} });
    },
    factors: () => {
      factors++;
      return Promise.resolve({ baseline: 1, factors: [] });
    },
  } as unknown as SimulationApi;
  return { client, runs, sweeps, factorCalls: () => factors };
}

const isBusy = () =>
  screen.getAllByRole("status").some((el) => /Simulating|Analysing/.test(el.textContent ?? ""));

/** The fan chart's legend (the value explorer has one, too). */
const fanChartLegend = () => screen.getAllByRole("list", { name: "Legend" })[0] as HTMLElement;

/** Renders the app and waits until the first simulation and analyses are done. */
async function renderSettled(client: SimulationApi) {
  renderApp(client);
  await within(await resultsCard()).findAllByRole("article");
  await pastDebounce();
  await vi.waitFor(() => expect(isBusy()).toBe(false));
}

/** Longer than the debounce of simulation (250 ms) and analyses (500 ms). */
const pastDebounce = () => new Promise((r) => setTimeout(r, 700));

test("REQ-009-04 renaming a scenario re-simulates nothing and shows the new name", async () => {
  const { client, runs, sweeps, factorCalls } = recordingClient();
  await renderSettled(client);
  const before = { runs: runs.length, sweeps: sweeps.length, factors: factorCalls() };

  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "My plan" } });
  const legend = fanChartLegend();
  expect(within(legend).getByText("My plan")).toBeInTheDocument();
  expect(within(await resultsCard()).getByRole("article", { name: "My plan" })).toBeInTheDocument();
  expect(screen.queryAllByText("Updating")).toHaveLength(0);
  expect(isBusy()).toBe(false);

  await pastDebounce();
  // REQ-009-05: the analyses of the renamed (selected) scenario are not rerun either.
  expect({ runs: runs.length, sweeps: sweeps.length, factors: factorCalls() }).toEqual(before);
  expect(screen.queryAllByText("Updating")).toHaveLength(0);
});

test("REQ-009-04 editing one scenario re-simulates and marks only that scenario", async () => {
  const { client, runs } = recordingClient(1);
  await renderSettled(client);
  expect(runs).toEqual([["s1", "s2", "s3"]]);

  pickTab("Scenarios", /2× buy and hold/);
  fireEvent.keyDown(leverageSlider(), { key: "ArrowRight" });
  await vi.waitFor(() => expect(runs.at(-1)).toEqual(["s2"]));
  expect(runs).toHaveLength(2);

  const card = await resultsCard();
  const article = (name: string) => within(card).getByRole("article", { name });
  expect(article("2× buy and hold")).toHaveAttribute("aria-busy", "true");
  expect(article("1× buy and hold")).not.toHaveAttribute("aria-busy", "true");
  expect(article("2× with 10-month SMA")).not.toHaveAttribute("aria-busy", "true");
  expect(
    screen.getAllByRole("status").some((el) => /Simulating 1 scenario…/.test(el.textContent ?? "")),
  ).toBe(true);
});

test("REQ-009-04 changing a shared setting still re-simulates every scenario", async () => {
  const { client, runs } = recordingClient();
  await renderSettled(client);
  const shared = screen.getByText("Costs & taxes").closest("[data-slot=card]") as HTMLElement;
  fireEvent.click(within(shared).getByRole("switch", { name: "Apply German taxes" }));
  await vi.waitFor(() => expect(runs).toHaveLength(2));
  expect(runs.at(-1)).toEqual(["s1", "s2", "s3"]);
});

test("REQ-009-05 renaming the selected scenario or hiding another does not rerun the analyses", async () => {
  const { client, sweeps, factorCalls } = recordingClient();
  await renderSettled(client);
  const before = { sweeps: sweeps.length, factors: factorCalls() };
  expect(before.sweeps).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("button", { name: "Show 2× buy and hold" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Renamed" } });
  fireEvent.click(screen.getByRole("button", { name: "Show 2× buy and hold" }));
  expect(screen.queryAllByText("Updating")).toHaveLength(0);
  await pastDebounce();
  expect({ sweeps: sweeps.length, factors: factorCalls() }).toEqual(before);
  expect(screen.queryAllByText("Updating")).toHaveLength(0);
  expect(isBusy()).toBe(false);
});

test("REQ-009-06 a scenario shown again reuses its results", async () => {
  const { client, runs } = recordingClient();
  await renderSettled(client);
  const legend = fanChartLegend();
  const toggle = screen.getByRole("button", { name: "Show 2× buy and hold" });
  fireEvent.click(toggle);
  await vi.waitFor(() =>
    expect(within(legend).queryByText("2× buy and hold")).not.toBeInTheDocument(),
  );
  fireEvent.click(toggle);
  expect(within(legend).getByText("2× buy and hold")).toBeInTheDocument();
  expect(isBusy()).toBe(false);
  await pastDebounce();
  expect(runs).toEqual([["s1", "s2", "s3"]]);
});

describe("REQ-012 UI language", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = "en";
  });

  const preferLanguages = (languages: string[]) =>
    vi.spyOn(Object.getPrototypeOf(navigator), "languages", "get").mockReturnValue(languages);

  test("REQ-012-01 / REQ-012-05 switching to German translates the UI without recalculating", async () => {
    const { client, runs, sweeps, factorCalls } = recordingClient();
    await renderSettled(client);
    const before = { runs: runs.length, sweeps: sweeps.length, factors: factorCalls() };
    expect(document.documentElement.lang).toBe("en");

    const language = screen.getByRole("group", { name: "Language" });
    fireEvent.click(within(language).getByRole("button", { name: "Deutsch" }));

    expect(within(language).getByRole("button", { name: "Deutsch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("group", { name: "Sprache" })).toBe(language);
    expect(document.documentElement.lang).toBe("de");
    // Headings, labels, tabs, buttons, table headers and tooltips' triggers are German.
    expect(screen.getByText("Szenario-Einstellungen")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Markt & Daten" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Währung" })).toHaveTextContent("Euro");
    expect(screen.getByRole("button", { name: "Über Anlagedauer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Duplizieren/ })).toBeInTheDocument();
    expect(screen.getByText("Endwert nach Steuern — Perzentile")).toBeInTheDocument();
    expect(screen.queryByText("Scenario settings")).not.toBeInTheDocument();
    // Scenario names are the user's data and stay as they are.
    const tabs = screen.getByRole("tablist", { name: "Szenarien" });
    expect(within(tabs).getByRole("tab", { name: "1× buy and hold" })).toBeInTheDocument();
    // The results are still shown and nothing was simulated or analysed again.
    const card = await resultsCard(/Endwert nach Steuern — Perzentile/);
    expect(within(card).getAllByRole("article")).toHaveLength(3);
    await pastDebounce();
    expect({ runs: runs.length, sweeps: sweeps.length, factors: factorCalls() }).toEqual(before);
  });

  test("REQ-012-02 the chosen language survives a reload", async () => {
    const { unmount } = renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Deutsch" }));
    unmount();
    renderApp();
    expect(await screen.findByText("Szenario-Einstellungen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("Scenario settings")).toBeInTheDocument();
  });

  test("REQ-012-03 a first visit with a German browser opens in German", async () => {
    preferLanguages(["de-AT", "en"]);
    renderApp();
    expect(await screen.findByText("Szenario-Einstellungen")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("de");
    // The default scenarios of a first visit are named in its language.
    const tabs = screen.getByRole("tablist", { name: "Szenarien" });
    expect(within(tabs).getByRole("tab", { name: "1× Buy and Hold" })).toBeInTheDocument();
  });

  test("REQ-012-03 a first visit with another browser language opens in English", async () => {
    preferLanguages(["fr-FR", "de"]);
    renderApp();
    expect(await screen.findByText("Scenario settings")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  test("REQ-012-04 German results use German number formats", async () => {
    localStorage.setItem("investcalc:language", "de");
    const { client } = recordingClient();
    renderApp(client);
    const card = await resultsCard(/Endwert nach Steuern — Perzentile/);
    const article = await within(card).findByRole("article", { name: "1× Buy and Hold" });
    // fakeResult: P50 = €4, 0 % chance of loss.
    expect(await within(article).findByText(/^4\s€$/)).toBeInTheDocument();
    expect(within(article).getByText("0,0 %")).toBeInTheDocument();
  });
});
