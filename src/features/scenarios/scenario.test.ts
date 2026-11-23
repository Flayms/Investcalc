import {
  defaultChoices,
  defaultShared,
  initialScenarios,
  moveScenario,
  newKey,
  SHARED_KEYS,
  toParams,
} from "@/features/scenarios/scenario";
import { defaultScenario } from "@/simulation/params";

test("REQ-002-02 a scenario's choices and the shared settings merge into full parameters", () => {
  const params = toParams(
    { ...defaultChoices, name: "A", leverage: 3 },
    { ...defaultShared, taxRate: 0.28, orderFee: 0 },
  );
  expect(params).toEqual({
    ...defaultScenario,
    name: "A",
    leverage: 3,
    taxRate: 0.28,
    orderFee: 0,
  });
});

test("REQ-002-02 scenario choices hold no shared setting", () => {
  for (const s of initialScenarios()) {
    for (const key of SHARED_KEYS) expect(s.params).not.toHaveProperty(key);
  }
  for (const key of [
    "fromYear",
    "toYear",
    "terUnleveraged",
    "terLeveraged",
    "includeSofr",
    "financingSpread",
    "orderFee",
    "bidAskSpread",
    "taxesEnabled",
    "taxRate",
    "partialExemption",
    "allowance",
    "baseRate",
  ]) {
    expect(SHARED_KEYS).toContain(key);
  }
});

test("REQ-002-01 new keys never collide with restored scenarios", () => {
  const restored = initialScenarios().map((s, i) => ({ ...s, key: `s${i + 7}` }));
  const key = newKey(restored);
  expect(restored.map((s) => s.key)).not.toContain(key);
});

test("REQ-005-01 moving a scenario shifts the others and keeps its color", () => {
  const s = initialScenarios();
  const moved = moveScenario(s, "s3", 0);
  expect(moved.map((x) => x.key)).toEqual(["s3", "s1", "s2"]);
  expect(moved[0]).toBe(s[2]);
  expect(moveScenario(s, "s1", 2).map((x) => x.key)).toEqual(["s2", "s3", "s1"]);
  expect(moveScenario(s, "s1", 9).map((x) => x.key)).toEqual(["s2", "s3", "s1"]);
  expect(moveScenario(s, "nope", 0)).toBe(s);
});

test("REQ-015-09 the first-visit scenarios use the US total market", () => {
  expect(initialScenarios().map((s) => s.params.etfId)).toEqual([
    "us-market",
    "us-market",
    "us-market",
  ]);
  const sma = initialScenarios().find((s) => s.params.strategy === "sma");
  expect(sma?.params.smaDays).toBe(200);
});
