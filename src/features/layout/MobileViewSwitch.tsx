import { LoaderCircleIcon } from "lucide-react";
import { useI18n } from "@/features/i18n/i18n";
import { cn } from "@/lib/utils";

export type MobileView = "results" | "settings";

const VIEWS: MobileView[] = ["results", "settings"];

type Props = { view: MobileView; onChange: (view: MobileView) => void; running: boolean };

/** Sticky switch between results and settings on small screens; both are shown side by side on large ones. */
export function MobileViewSwitch({ view, onChange, running }: Props) {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <div
          role="tablist"
          aria-label={t.mobile.view}
          className="grid flex-1 grid-cols-2 rounded-lg bg-muted p-1"
        >
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => {
                onChange(v);
                window.scrollTo({ top: 0 });
              }}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                view === v ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.mobile[v]}
            </button>
          ))}
        </div>
        <LoaderCircleIcon
          className={cn("size-5 animate-spin text-muted-foreground", !running && "invisible")}
          aria-label={running ? t.mobile.simulating : undefined}
          aria-hidden={!running}
        />
      </div>
    </div>
  );
}
