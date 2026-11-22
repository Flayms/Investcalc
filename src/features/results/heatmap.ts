/** Sequential single-hue ramp (reference palette, blue steps 100–500), light = low, dark = high. */
export const HEAT_RAMP = [
  "#cde2fb",
  "#b7d3f6",
  "#9ec5f4",
  "#86b6ef",
  "#6da7ec",
  "#5598e7",
  "#3987e5",
  "#2a78d6",
  "#256abf",
] as const;
/** From this step on, light text reads better than dark text. */
const FIRST_DARK_STEP = 7;

export type Heat = { background: string; dark: boolean; best: boolean };

/**
 * Shades the values of one table column relative to each other (REQ-002-03).
 * Undefined values (no result) and columns with fewer than two values stay unshaded.
 */
export function columnHeat(values: (number | undefined)[]): (Heat | undefined)[] {
  const present = values.filter((v): v is number => v !== undefined && Number.isFinite(v));
  if (present.length < 2) return values.map(() => undefined);
  const min = Math.min(...present);
  const max = Math.max(...present);
  return values.map((v) => {
    if (v === undefined || !Number.isFinite(v)) return undefined;
    const t = max === min ? 1 : (v - min) / (max - min);
    const step = Math.round(t * (HEAT_RAMP.length - 1));
    return {
      background: HEAT_RAMP[step] as string,
      dark: step >= FIRST_DARK_STEP,
      best: v === max,
    };
  });
}
