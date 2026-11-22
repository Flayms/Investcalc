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
