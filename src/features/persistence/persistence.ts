import { z } from "zod";
import {
  choicesSchema,
  MAX_SCENARIOS,
  type Scenario,
  type SharedSettings,
  sharedSchema,
} from "@/features/scenarios/scenario";
import { datasetIds } from "@/simulation/dataset";
import { type GlobalSettings, globalSchema } from "@/simulation/params";

/** Bump when the stored shape changes incompatibly; older state is then ignored. */
const VERSION = 1;
const STORAGE_KEY = "investcalc:state";

export type PersistedState = {
  scenarios: Scenario[];
  selectedKey: string;
  global: GlobalSettings;
  shared: SharedSettings;
};

const stateSchema = z.object({
  version: z.literal(VERSION),
  scenarios: z
    .array(
      z.object({
        key: z.string().min(1),
        colorIndex: z
          .number()
          .int()
          .min(0)
          .max(MAX_SCENARIOS - 1),
        // Only indices that exist, so a restored scenario can always be simulated.
        params: choicesSchema.extend({ etfId: z.enum(datasetIds) }),
        // Missing in state saved before scenarios could be hidden: visible (REQ-004-03).
        hidden: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(MAX_SCENARIOS),
  selectedKey: z.string(),
  global: globalSchema,
  shared: sharedSchema,
});

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** The stored dashboard state, or undefined if there is none or it is unusable (REQ-002-01). */
export function loadState(storage: KeyValueStore | undefined): PersistedState | undefined {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return undefined;
    const { version: _, ...state } = parsed.data;
    return state;
  } catch {
    return undefined;
  }
}

export function saveState(storage: KeyValueStore | undefined, state: PersistedState): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...state }));
  } catch {
    // Storage full or disabled (private mode): the dashboard still works, it just forgets.
  }
}

/** `localStorage` if the browser allows access to it. */
export function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
