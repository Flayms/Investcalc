import { isSuperseded, SimulationClient, type Transport } from "@/features/simulation/client";
import type { Dataset } from "@/simulation/dataset";
import { defaultGlobal, defaultScenario } from "@/simulation/params";
import type { WorkerRequest, WorkerResponse } from "@/simulation/protocol";

/** A worker stand-in that only answers when told to. */
function manualTransport() {
  const posted: WorkerRequest[] = [];
  const transport: Transport = {
    post: (req) => posted.push(req),
    onResponse: () => {},
  };
  const answer = (req: WorkerRequest | undefined) => {
    if (!req) throw new Error("nothing posted");
    const res: WorkerResponse =
      req.type === "run"
        ? { id: req.id, type: "run", results: {} }
        : req.type === "factors"
          ? { id: req.id, type: "factors", factors: { baseline: req.id, factors: [] } }
          : { id: req.id, type: "error", message: "unused" };
    transport.onResponse(res);
  };
  return { transport, posted, answer };
}

const dataset = {} as Dataset;
const settled = <T>(p: Promise<T>) =>
  p.then(
    (v) => ({ ok: true as const, v }),
    (e: unknown) => ({ ok: false as const, e }),
  );

describe("REQ-009-03 outdated work is skipped", () => {
  test("REQ-009-03 a queued request is replaced by a newer one of the same kind", async () => {
    const { transport, posted, answer } = manualTransport();
    const client = new SimulationClient(transport);
    const busy = client.run([], defaultGlobal);
    const stale = settled(client.factors(dataset, defaultScenario, defaultGlobal));
    const fresh = client.factors(dataset, { ...defaultScenario, leverage: 3 }, defaultGlobal);
    expect(posted).toHaveLength(1);
    answer(posted[0]);
    await busy;
    const r = await stale;
    expect(r.ok).toBe(false);
    expect(!r.ok && isSuperseded(r.e)).toBe(true);
    expect(posted).toHaveLength(2);
    const second = posted[1];
    expect(second?.type === "factors" && second.scenario.leverage).toBe(3);
    answer(second);
    expect((await fresh).baseline).toBe(second?.id);
  });

  test("REQ-009-03 the simulation of all scenarios runs before queued analyses", async () => {
    const { transport, posted, answer } = manualTransport();
    const client = new SimulationClient(transport);
    void settled(client.factors(dataset, defaultScenario, defaultGlobal));
    void settled(client.sweep(dataset, defaultScenario, defaultGlobal, "leverage"));
    void settled(client.run([], defaultGlobal));
    expect(posted.map((r) => r.type)).toEqual(["factors"]);
    answer(posted[0]);
    await vi.waitFor(() => expect(posted.map((r) => r.type)).toEqual(["factors", "run"]));
  });

  test("REQ-009-03 sweeps of different sliders do not replace each other", async () => {
    const { transport, posted, answer } = manualTransport();
    const client = new SimulationClient(transport);
    void settled(client.run([], defaultGlobal));
    const a = settled(client.sweep(dataset, defaultScenario, defaultGlobal, "leverage"));
    void settled(client.sweep(dataset, defaultScenario, defaultGlobal, "smaMonths"));
    answer(posted[0]);
    await vi.waitFor(() => expect(posted).toHaveLength(2));
    answer(posted[1]);
    await vi.waitFor(() => expect(posted).toHaveLength(3));
    expect((await a).ok).toBe(false); // answered with an error by the fake, not superseded
    const r = await a;
    expect(!r.ok && isSuperseded(r.e)).toBe(false);
  });
});
