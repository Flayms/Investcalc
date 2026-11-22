import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SCENARIOS, type Scenario, scenarioColor } from "@/features/scenarios/scenario";
import { cn } from "@/lib/utils";

type Props = {
  scenarios: Scenario[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function ScenarioBar({
  scenarios,
  selectedKey,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
}: Props) {
  const full = scenarios.length >= MAX_SCENARIOS;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Scenarios" className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={s.key === selectedKey}
            onClick={() => onSelect(s.key)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
              s.key === selectedKey
                ? "border-foreground/40 bg-card shadow-sm"
                : "border-transparent bg-muted hover:bg-card",
            )}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: scenarioColor(s) }}
              aria-hidden
            />
            {s.params.name}
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-1">
        <Button size="sm" variant="outline" onClick={onAdd} disabled={full}>
          <PlusIcon /> New
        </Button>
        <Button size="sm" variant="outline" onClick={onDuplicate} disabled={full}>
          <CopyIcon /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRemove}
          disabled={scenarios.length <= 1}
          aria-label="Remove scenario"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}
