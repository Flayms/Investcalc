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

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App loadDataset={loadDataset} simulationClient={idleClient} />
    </QueryClientProvider>,
  );
}

test("renders the app title", async () => {
  renderApp();
  expect(screen.getByRole("heading", { name: "Investcalc" })).toBeInTheDocument();
});

test("REQ-001-01 the data basis lists all three indices with period, CAGR and volatility", async () => {
  renderApp();
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
  await screen.findByText("Current market");
  expect(screen.getByText(/Bull market|Correction|Bear market/)).toBeInTheDocument();
  expect(screen.getByText(/(Above|Below) 10-month SMA/)).toBeInTheDocument();
  expect(screen.getByText("Distance from all-time high")).toBeInTheDocument();
});
