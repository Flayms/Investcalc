import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_SCENARIOS, type Scenario, scenarioColor } from "@/features/scenarios/scenario";
import { cn } from "@/lib/utils";

type Props = {
  scenarios: Scenario[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onToggleVisible: (key: string) => void;
  /** Moves the scenario `key` to position `toIndex` (REQ-005-01). */
  onMove: (key: string, toIndex: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function ScenarioBar({
  scenarios,
  selectedKey,
  onSelect,
  onToggleVisible,
  onMove,
  onAdd,
  onDuplicate,
  onRemove,
}: Props) {
  const full = scenarios.length >= MAX_SCENARIOS;
  const [dragKey, setDragKey] = useState<string>();
  const [dropIndex, setDropIndex] = useState<number>();
  const selectedIndex = scenarios.findIndex((s) => s.key === selectedKey);
  const endDrag = () => {
    setDragKey(undefined);
    setDropIndex(undefined);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Scenarios" className="flex flex-wrap gap-2">
        {scenarios.map((s, index) => {
          const selected = s.key === selectedKey;
          const visible = !s.hidden;
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is a pointer shortcut; keyboard and touch users have the move buttons (REQ-005-02).
            <div
              key={s.key}
              role="presentation"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", s.key);
                setDragKey(s.key);
              }}
              onDragOver={(e) => {
                if (!dragKey) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropIndex(index);
              }}
              onDragLeave={() => setDropIndex(undefined)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKey) onMove(dragKey, index);
                endDrag();
              }}
              onDragEnd={endDrag}
              className={cn(
                "flex cursor-grab items-center rounded-md border text-sm transition-colors active:cursor-grabbing",
                selected
                  ? "border-foreground/40 bg-card shadow-sm"
                  : "border-transparent bg-muted hover:bg-card",
                s.key === dragKey && "opacity-50",
                dropIndex === index && s.key !== dragKey && "ring-2 ring-ring",
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelect(s.key)}
                className={cn(
                  "flex items-center gap-2 py-1.5 pr-1 pl-3",
                  !visible && "text-muted-foreground line-through decoration-1",
                )}
              >
                <span
                  className="size-2.5 rounded-full border-2"
                  style={{
                    borderColor: scenarioColor(s),
                    background: visible ? scenarioColor(s) : "transparent",
                  }}
                  aria-hidden
                />
                {s.params.name}
              </button>
              <button
                type="button"
                aria-label={`Show ${s.params.name}`}
                aria-pressed={visible}
                title={visible ? "Hide from chart and table" : "Show in chart and table"}
                onClick={() => onToggleVisible(s.key)}
                className="mr-1 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {visible ? (
                  <EyeIcon className="size-3.5" aria-hidden />
                ) : (
                  <EyeOffIcon className="size-3.5" aria-hidden />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div className="ml-auto flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMove(selectedKey, selectedIndex - 1)}
          disabled={selectedIndex <= 0}
          aria-label="Move left"
          title="Move the selected scenario left"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMove(selectedKey, selectedIndex + 1)}
          disabled={selectedIndex >= scenarios.length - 1}
          aria-label="Move right"
          title="Move the selected scenario right"
        >
          <ChevronRightIcon />
        </Button>
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
