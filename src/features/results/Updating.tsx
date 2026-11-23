import { LoaderCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Badge for a card whose content is being recalculated (REQ-009-02). */
export function UpdatingBadge({ updating }: { updating: boolean }) {
  if (!updating) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
      <LoaderCircleIcon className="size-3 animate-spin" aria-hidden />
      Updating
    </span>
  );
}

/** Keeps the previous content visible but dimmed while it is recalculated (REQ-009-02). */
export function Stale({ updating, children }: { updating: boolean; children: ReactNode }) {
  return (
    <div
      aria-busy={updating}
      data-updating={updating || undefined}
      className={cn("transition-opacity duration-300", updating && "opacity-50")}
    >
      {children}
    </div>
  );
}
