import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Themed surface for chart tooltips (REQ-003-05). Use it in a Recharts `<Tooltip content>`
 * instead of the default tooltip, whose box is hard-coded white and unreadable in the dark theme.
 */
export function ChartTooltipBox({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background px-3 py-2 text-sm lg:text-xs shadow-md",
        className,
      )}
      {...props}
    />
  );
}

/** One series in a chart tooltip: color dot, muted name and the value on the right. */
export function ChartTooltipRow({
  color,
  name,
  value,
}: {
  color: string;
  name: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      <span className="text-muted-foreground">{name}</span>
      <span className="ml-auto pl-3 tabular-nums">{value}</span>
    </div>
  );
}
