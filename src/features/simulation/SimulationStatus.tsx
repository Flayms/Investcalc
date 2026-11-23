import { LoaderCircleIcon } from "lucide-react";
import type { Pending } from "@/features/simulation/useSimulation";
import { cn } from "@/lib/utils";

/** What is running, in words; undefined when everything is up to date. */
export function statusText(pending: Pending, selectedName: string) {
  const count = pending.run.length;
  if (count > 0) return `Simulating ${count} scenario${count === 1 ? "" : "s"}…`;
  if (pending.factors || Object.values(pending.sweeps).some(Boolean))
    return `Analysing “${selectedName}”…`;
  return undefined;
}

/**
 * Floating status that stays in view wherever the user has scrolled to (REQ-009-01). The live
 * region is always mounted so screen readers announce changes.
 */
export function SimulationStatus({ text }: { text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center transition-all duration-200",
        text ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      {text && (
        <span className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-lg">
          <LoaderCircleIcon className="size-4 animate-spin text-primary" aria-hidden />
          {text}
        </span>
      )}
    </div>
  );
}
