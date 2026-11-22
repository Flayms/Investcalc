import { LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileView = "results" | "settings";

const VIEWS: { id: MobileView; label: string }[] = [
  { id: "results", label: "Results" },
  { id: "settings", label: "Settings" },
];

type Props = { view: MobileView; onChange: (view: MobileView) => void; running: boolean };

/** Sticky switch between results and settings on small screens; both are shown side by side on large ones. */
export function MobileViewSwitch({ view, onChange, running }: Props) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <div
          role="tablist"
          aria-label="View"
          className="grid flex-1 grid-cols-2 rounded-lg bg-muted p-1"
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => {
                onChange(v.id);
                window.scrollTo({ top: 0 });
              }}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                view === v.id ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <LoaderCircleIcon
          className={cn("size-5 animate-spin text-muted-foreground", !running && "invisible")}
          aria-label={running ? "Simulating" : undefined}
          aria-hidden={!running}
        />
      </div>
    </div>
  );
}
