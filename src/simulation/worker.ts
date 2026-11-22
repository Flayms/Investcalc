/// <reference lib="webworker" />
import { handleRequest, type WorkerRequest } from "@/simulation/protocol";

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  self.postMessage(handleRequest(event.data));
};
