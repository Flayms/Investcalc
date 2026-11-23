import { loadState, type PersistedState, saveState } from "@/features/persistence/persistence";
import { defaultShared, initialScenarios } from "@/features/scenarios/scenario";
import { defaultGlobal } from "@/simulation/params";

const state = (): PersistedState => {
  const scenarios = initialScenarios();
  return {
    scenarios,
    selectedKey: scenarios[1]?.key ?? "",
    global: { ...defaultGlobal, horizonYears: 30 },
    shared: { ...defaultShared, taxRate: 0.28 },
  };
};

test("REQ-002-01 saved state is restored unchanged", () => {
  const s = state();
  saveState(localStorage, s);
  expect(loadState(localStorage)).toEqual(s);
});

test("REQ-002-01 missing state yields undefined", () => {
  localStorage.clear();
  expect(loadState(localStorage)).toBeUndefined();
});

test("REQ-002-01 invalid or corrupt state is ignored", () => {
  localStorage.setItem("investcalc:state", "{not json");
  expect(loadState(localStorage)).toBeUndefined();
  localStorage.setItem(
    "investcalc:state",
    JSON.stringify({ ...state(), version: 1, scenarios: [{ key: "x" }] }),
  );
  expect(loadState(localStorage)).toBeUndefined();
  localStorage.setItem(
    "investcalc:state",
    JSON.stringify({ ...state(), version: 1, scenarios: [] }),
  );
  expect(loadState(localStorage)).toBeUndefined();
});

test("REQ-002-01 state from another version is ignored", () => {
  localStorage.setItem("investcalc:state", JSON.stringify({ ...state(), version: 999 }));
  expect(loadState(localStorage)).toBeUndefined();
});

test("REQ-004-03 hidden scenarios are restored", () => {
  const s = state();
  s.scenarios = s.scenarios.map((sc, i) => ({ ...sc, hidden: i === 1 }));
  saveState(localStorage, s);
  expect(loadState(localStorage)?.scenarios.map((sc) => sc.hidden)).toEqual([false, true, false]);
});

test("REQ-004-03 state without visibility restores every scenario visible", () => {
  const s = state();
  const legacy = s.scenarios.map(({ hidden: _, ...sc }) => sc);
  localStorage.setItem("investcalc:state", JSON.stringify({ ...s, version: 1, scenarios: legacy }));
  expect(loadState(localStorage)?.scenarios.every((sc) => !sc.hidden)).toBe(true);
});

test("REQ-011-06 state saved before the currency setting loads with the euro", () => {
  const { currency: _, ...shared } = state().shared;
  localStorage.setItem("investcalc:state", JSON.stringify({ ...state(), version: 1, shared }));
  expect(loadState(localStorage)?.shared.currency).toBe("EUR");
});

test("REQ-013-06 state saved before the inflation setting loads with it switched on", () => {
  const { inflationAdjusted: _, ...shared } = state().shared;
  localStorage.setItem("investcalc:state", JSON.stringify({ ...state(), version: 1, shared }));
  expect(loadState(localStorage)?.shared.inflationAdjusted).toBe(true);
});
