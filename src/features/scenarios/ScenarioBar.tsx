import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
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

type TabProps = {
  scenario: Scenario;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
};

function ScenarioTab({ scenario: s, selected, onSelect, onToggleVisible }: TabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: s.key });
  const visible = !s.hidden;
  const name = s.params.name;
  return (
    <div
      ref={setNodeRef}
      // Pointer listeners on the whole tab (REQ-005-01); the keyboard only starts a drag from the
      // handle, which is the activator node, so Space/Enter on the tab still selects (REQ-005-04).
      {...listeners}
      data-scenario-tab={s.key}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative flex touch-manipulation items-center rounded-md border text-sm select-none",
        selected
          ? "border-foreground/40 bg-card shadow-sm"
          : "border-transparent bg-muted hover:bg-card",
        isDragging && "z-10 cursor-grabbing shadow-lg ring-2 ring-ring",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        aria-roledescription="sortable"
        aria-label={`Reorder ${name}`}
        title="Drag to reorder (or focus and press Space, then the arrow keys)"
        className="cursor-grab self-stretch rounded-l-md pl-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={onSelect}
        className={cn(
          "flex items-center gap-2 py-1.5 pr-1 pl-1.5",
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
        {name}
      </button>
      <button
        type="button"
        aria-label={`Show ${name}`}
        aria-pressed={visible}
        title={visible ? "Hide from chart and table" : "Show in chart and table"}
        onClick={onToggleVisible}
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
}

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
  const sensors = useSensors(
    // A click or a tap without moving selects instead of dragging (REQ-005-05).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold, so swiping still scrolls the page (REQ-005-05).
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nameOf = (id: string | number) =>
    scenarios.find((s) => s.key === id)?.params.name ?? String(id);
  const positionOf = (id: string | number) => scenarios.findIndex((s) => s.key === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${nameOf(active.id)}, position ${positionOf(active.id)} of ${scenarios.length}.`,
    // Nothing to say while it is still over its own place.
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? `${nameOf(active.id)} moved to position ${positionOf(over.id)}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)}.`
        : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} cancelled.`,
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(
      String(active.id),
      scenarios.findIndex((s) => s.key === over.id),
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To reorder, press Space or Enter, move with the arrow keys, then press Space or Enter again. Escape cancels.",
          },
        }}
      >
        <SortableContext items={scenarios.map((s) => s.key)} strategy={rectSortingStrategy}>
          <div role="tablist" aria-label="Scenarios" className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <ScenarioTab
                key={s.key}
                scenario={s}
                selected={s.key === selectedKey}
                onSelect={() => onSelect(s.key)}
                onToggleVisible={() => onToggleVisible(s.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
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
