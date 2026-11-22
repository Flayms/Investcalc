import type { Dataset } from "@/simulation/dataset";
import type { GlobalSettings, ScenarioParams } from "@/simulation/params";
import {
  type Analysis,
  handleRequest,
  type RunJob,
  type WorkerRequest,
  type WorkerResponse,
} from "@/simulation/protocol";
import type { ScenarioResult } from "@/simulation/simulate";

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

type Pending = { resolve: (r: WorkerResponse) => void };

/** Runs simulations in a Web Worker; falls back to the main thread where workers are missing (tests). */
export class SimulationClient {
  private worker?: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor() {
    if (typeof Worker !== "undefined") {
      this.worker = new Worker(new URL("../../simulation/worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.pending.get(e.data.id)?.resolve(e.data);
        this.pending.delete(e.data.id);
      };
    }
  }

  private send(req: WithoutId<WorkerRequest>): Promise<WorkerResponse> {
    const full = { ...req, id: this.nextId++ } as WorkerRequest;
    if (!this.worker) return Promise.resolve(handleRequest(full));
    return new Promise((resolve) => {
      this.pending.set(full.id, { resolve });
      this.worker?.postMessage(full);
    });
  }

  async run(jobs: RunJob[], global: GlobalSettings): Promise<Record<string, ScenarioResult>> {
    const res = await this.send({ type: "run", jobs, global });
    if (res.type === "error") throw new Error(res.message);
    if (res.type !== "run") throw new Error("unexpected response");
    return res.results;
  }

  async analyze(
    dataset: Dataset,
    scenario: ScenarioParams,
    global: GlobalSettings,
  ): Promise<Analysis> {
    const res = await this.send({ type: "analyze", dataset, scenario, global });
    if (res.type === "error") throw new Error(res.message);
    if (res.type !== "analyze") throw new Error("unexpected response");
    return res.analysis;
  }
}
