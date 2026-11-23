import { useState } from "react";
import { useI18n } from "@/features/i18n/i18n";
import type { Language } from "@/features/i18n/language";
import type { Unit } from "@/features/scenarios/fields";
import { cn } from "@/lib/utils";

/** Settings stored as fractions are typed in percent. */
const SCALE: Record<Unit, number> = {
  percent: 100,
  euro: 1,
  factor: 1,
  months: 1,
  years: 1,
  count: 1,
};
const WHOLE: Record<Unit, boolean> = {
  percent: false,
  euro: false,
  factor: false,
  months: true,
  years: true,
  count: true,
};
/** Value as shown in the box, without float noise (0.0007 × 100 → "0.07"; "0,07" in German). */
export function toDisplay(unit: Unit, value: number, language: Language = "en"): string {
  const text = String(Number((value * SCALE[unit]).toFixed(8)));
  return language === "de" ? text.replace(".", ",") : text;
}

/**
 * Parses what the user typed (REQ-003-01, REQ-003-02): accepts a decimal comma, clamps to the
 * range and rounds whole-unit settings. Returns undefined for input that is not a number.
 */
export function parseInput(unit: Unit, text: string, min: number, max: number): number | undefined {
  const normalised = text.trim().replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalised)) return undefined;
  let value = Number(normalised) / SCALE[unit];
  if (WHOLE[unit]) value = Math.round(value);
  return Math.min(max, Math.max(min, value));
}

type Props = {
  label: string;
  unit: Unit;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

/** Small text box next to a slider for typing an exact value. */
export function ValueInput({ label, unit, min, max, value, onChange, className }: Props) {
  // While the user types, the box shows their draft instead of the committed value.
  const [draft, setDraft] = useState<string | undefined>();
  const { language, t } = useI18n();
  // "€500" in English, "500 €" in German (REQ-014-04).
  const prefix: Partial<Record<Unit, string>> = language === "de" ? {} : { euro: "€" };
  const suffix: Partial<Record<Unit, string>> = {
    ...(language === "de" && { euro: "€" }),
    percent: "%",
    factor: "×",
    months: t.units.months,
    years: t.units.years,
  };

  const commit = () => {
    if (draft === undefined) return;
    const parsed = parseInput(unit, draft, min, max);
    setDraft(undefined);
    if (parsed !== undefined && parsed !== value) onChange(parsed);
  };

  return (
    <span
      className={cn(
        "sketch-input inline-flex h-8 lg:h-7 items-center gap-0.5 px-1.5 text-sm lg:text-xs tabular-nums",
        "focus-within:ring-2 focus-within:ring-ring/60",
        className,
      )}
    >
      {prefix[unit] && <span className="text-muted-foreground">{prefix[unit]}</span>}
      <input
        type="text"
        inputMode="decimal"
        aria-label={t.common.value(label)}
        className="w-[7ch] bg-transparent text-right outline-none"
        value={draft ?? toDisplay(unit, value, language)}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(undefined);
        }}
      />
      {suffix[unit] && <span className="text-muted-foreground">{suffix[unit]}</span>}
    </span>
  );
}
