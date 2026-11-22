import {
  defaultChoices,
  defaultShared,
  initialScenarios,
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
