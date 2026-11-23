import { simulationInputs } from "@/features/simulation/useSimulation";
import { defaultGlobal, defaultScenario, type ScenarioParams } from "@/simulation/params";

const changed = (v: unknown) =>
  typeof v === "number" ? v + 1 : typeof v === "boolean" ? !v : `${String(v)}-changed`;

describe("simulationInputs", () => {
  const base = simulationInputs(defaultScenario, defaultGlobal);

  test("REQ-009-04 the name does not affect the simulation inputs", () => {
    expect(simulationInputs({ ...defaultScenario, name: "Other" }, defaultGlobal)).toBe(base);
  });

  test("REQ-009-04 the order of the settings does not matter", () => {
    const reversed = Object.fromEntries(Object.entries(defaultScenario).reverse());
    expect(simulationInputs(reversed as ScenarioParams, defaultGlobal)).toBe(base);
  });

  test("REQ-009-04 every other scenario and global setting changes the inputs", () => {
    for (const [key, value] of Object.entries(defaultScenario)) {
      if (key === "name") continue;
      const params = { ...defaultScenario, [key]: changed(value) };
      expect(simulationInputs(params, defaultGlobal), key).not.toBe(base);
    }
    for (const [key, value] of Object.entries(defaultGlobal)) {
      const global = { ...defaultGlobal, [key]: changed(value) };
      expect(simulationInputs(defaultScenario, global), key).not.toBe(base);
    }
  });
});
