import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Field } from "@/features/scenarios/fields";
import { ValueInput } from "@/features/scenarios/ValueInput";
import { cn } from "@/lib/utils";

export function HelpTooltip({
  label,
  help,
  recommendation,
}: {
  label: string;
  help: string;
  recommendation?: string;
}) {
  // Controlled so that a tap/click toggles it (Radix tooltips only react to hover and focus).
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          // preventDefault stops Radix' own handlers, which close the tooltip on pointer down / click
          // (iOS Safari does not focus buttons on tap, so focus does not open it either).
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") e.preventDefault();
          }}
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          aria-label={`About ${label}`}
          className="-m-1.5 p-1.5 text-muted-foreground hover:text-foreground lg:-m-1 lg:p-1"
        >
          <InfoIcon className="size-4 lg:size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-sm lg:text-xs leading-relaxed">
        <p>{help}</p>
        {recommendation && (
          <p className="mt-1.5">
            <span className="font-semibold">Recommended: </span>
            {recommendation}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function NotRecommended() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs lg:text-[10px] font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
      <TriangleAlertIcon className="size-3" aria-hidden />
      Not recommended
    </span>
  );
}

type Props<K> = {
  field: Field<K>;
  value: number | boolean | string;
  onChange: (value: number | boolean | string) => void;
  /** Shown under a slider, e.g. how its value pays off (REQ-008-05). */
  footer?: ReactNode;
};

export function FieldControl<K extends string>({ field, value, onChange, footer }: Props<K>) {
  const id = useId();
  const deviates =
    (field.kind === "slider" && field.isRecommended && !field.isRecommended(value as number)) ||
    (field.kind === "switch" && field.isRecommended && !field.isRecommended(value as boolean));

  const header = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={id} className="text-sm lg:text-xs font-medium">
        {field.label}
      </Label>
      <HelpTooltip label={field.label} help={field.help} recommendation={field.recommendation} />
      {deviates && <NotRecommended />}
      {field.kind === "slider" && (
        <ValueInput
          className="ml-auto"
          label={field.label}
          unit={field.unit}
          min={field.min}
          max={field.max}
          value={value as number}
          onChange={onChange}
        />
      )}
      {field.kind === "switch" && (
        <Switch id={id} className="ml-auto" checked={value as boolean} onCheckedChange={onChange} />
      )}
    </div>
  );

  if (field.kind === "slider") {
    return (
      <div
        className={cn(
          "space-y-2",
          footer && "-mx-2 rounded-lg border border-dashed border-foreground/20 px-2 pt-2 pb-1.5",
        )}
        data-explored={footer ? "" : undefined}
      >
        {header}
        <Slider
          id={id}
          aria-label={field.label}
          min={field.min}
          max={field.max}
          step={field.step}
          value={[value as number]}
          onValueChange={([v]) => v !== undefined && onChange(v)}
        />
        {footer}
      </div>
    );
  }
  if (field.kind === "select") {
    return (
      <div className="space-y-1.5">
        {header}
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-10 lg:h-8 w-full text-sm lg:text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-sm lg:text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return header;
}
