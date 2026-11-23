import type { Dataset } from "@/simulation/dataset";
import type { GlobalSettings, ScenarioParams } from "@/simulation/params";
import {
  handleRequest,
  type RunJob,
  type WorkerRequest,
  type WorkerResponse,
} from "@/simulation/protocol";
import type { FactorImpact, ScenarioResult } from "@/simulation/simulate";
import type { ParameterSweep, SweepParam } from "@/simulation/sweep";

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

/** Where requests are computed: a Web Worker, or the main thread where workers are missing. */
export type Transport = {
  post: (req: WorkerRequest) => void;
  /** Set by the client; called with every response. */
  onResponse: (res: WorkerResponse) => void;
};

function workerTransport(): Transport {
  const worker = new Worker(new URL("../../simulation/worker.ts", import.meta.url), {
    type: "module",
  });
  const transport: Transport = {
    post: (req) => worker.postMessage(req),
    onResponse: () => {},
  };
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => transport.onResponse(e.data);
  return transport;
}

function inlineTransport(): Transport {
  const transport: Transport = {
    post: (req) => queueMicrotask(() => transport.onResponse(handleRequest(req))),
    onResponse: () => {},
  };
  return transport;
}

/** Rejection reason of a request that was replaced by a newer one before it started (REQ-009-03). */
class Superseded extends Error {
  constructor() {
    super("superseded by a newer request");
  }
}
export const isSuperseded = (e: unknown) => e instanceof Superseded;

type Queued = {
  /** Requests with the same slot replace each other while queued. */
  slot: string;
  /** Lower runs first. */
  priority: number;
  req: WithoutId<WorkerRequest>;
  resolve: (r: WorkerResponse) => void;
  reject: (e: unknown) => void;
};

/**
 * Runs simulations one at a time off the main thread. Queued requests that are outdated before
 * they start are dropped, and the simulation of all scenarios goes before analyses (REQ-009-03).
 */
export class SimulationClient {
  private transport: Transport;
  private nextId = 1;
  private queue: Queued[] = [];
  private inFlight?: { id: number; resolve: (r: WorkerResponse) => void };

  constructor(transport?: Transport) {
    this.transport =
      transport ?? (typeof Worker !== "undefined" ? workerTransport() : inlineTransport());
    this.transport.onResponse = (res) => {
      if (res.id !== this.inFlight?.id) return;
      const { resolve } = this.inFlight;
      this.inFlight = undefined;
      resolve(res);
      this.pump();
    };
  }

  private send(
    slot: string,
    priority: number,
    req: WithoutId<WorkerRequest>,
  ): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const stale = this.queue.find((q) => q.slot === slot);
      if (stale) {
        stale.reject(new Superseded());
        this.queue = this.queue.filter((q) => q !== stale);
      }
      this.queue.push({ slot, priority, req, resolve, reject });
      this.pump();
    });
  }

  private pump() {
    if (this.inFlight || this.queue.length === 0) return;
    const next = this.queue.reduce((a, b) => (b.priority < a.priority ? b : a));
    this.queue = this.queue.filter((q) => q !== next);
    const id = this.nextId++;
    this.inFlight = { id, resolve: next.resolve };
    this.transport.post({ ...next.req, id } as WorkerRequest);
  }

  async run(jobs: RunJob[], global: GlobalSettings): Promise<Record<string, ScenarioResult>> {
    const res = await this.send("run", 0, { type: "run", jobs, global });
    if (res.type === "error") throw new Error(res.message);
    if (res.type !== "run") throw new Error("unexpected response");
    return res.results;
  }

  async sweep(
    dataset: Dataset,
    scenario: ScenarioParams,
    global: GlobalSettings,
    param: SweepParam,
  ): Promise<ParameterSweep> {
    const res = await this.send(`sweep:${param}`, 1, {
      type: "sweep",
      dataset,
      scenario,
      global,
      param,
    });
    if (res.type === "error") throw new Error(res.message);
    if (res.type !== "sweep") throw new Error("unexpected response");
    return res.sweep;
  }

  async factors(
    dataset: Dataset,
    scenario: ScenarioParams,
    global: GlobalSettings,
  ): Promise<FactorImpact> {
    const res = await this.send("factors", 2, { type: "factors", dataset, scenario, global });
    if (res.type === "error") throw new Error(res.message);
    if (res.type !== "factors") throw new Error("unexpected response");
    return res.factors;
  }
}

export type SimulationApi = Pick<SimulationClient, "run" | "sweep" | "factors">;
