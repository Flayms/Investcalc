import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useId } from "react";
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
import type { Field, Unit } from "@/features/scenarios/fields";
import { formatEuro } from "@/lib/format";

export function formatFieldValue(unit: Unit, step: number, value: number): string {
  switch (unit) {
    case "percent": {
      const digits = Math.max(0, -Math.floor(Math.log10(step * 100) + 1e-9));
      return `${(value * 100).toFixed(digits)} %`;
    }
    case "euro":
      return step < 1 ? `€${value.toFixed(2)}` : formatEuro(value);
    case "factor":
      return `${value.toFixed(2)}×`;
    case "months":
      return `${value} mo`;
    case "years":
      return `${value} y`;
    case "count":
      return value.toLocaleString("en-US");
  }
}

export function HelpTooltip({
  label,
  help,
  recommendation,
}: {
  label: string;
  help: string;
  recommendation?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`About ${label}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <InfoIcon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-xs leading-relaxed">
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
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
      <TriangleAlertIcon className="size-3" aria-hidden />
      Not recommended
    </span>
  );
}

type Props<K> = {
  field: Field<K>;
  value: number | boolean | string;
  onChange: (value: number | boolean | string) => void;
};

export function FieldControl<K extends string>({ field, value, onChange }: Props<K>) {
  const id = useId();
  const deviates =
    (field.kind === "slider" && field.isRecommended && !field.isRecommended(value as number)) ||
    (field.kind === "switch" && field.isRecommended && !field.isRecommended(value as boolean));

  const header = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {field.label}
      </Label>
      <HelpTooltip label={field.label} help={field.help} recommendation={field.recommendation} />
      {deviates && <NotRecommended />}
      {field.kind === "slider" && (
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {formatFieldValue(field.unit, field.step, value as number)}
        </span>
      )}
      {field.kind === "switch" && (
        <Switch id={id} className="ml-auto" checked={value as boolean} onCheckedChange={onChange} />
      )}
    </div>
  );

  if (field.kind === "slider") {
    return (
      <div className="space-y-2">
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
      </div>
    );
  }
  if (field.kind === "select") {
    return (
      <div className="space-y-1.5">
        {header}
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
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
