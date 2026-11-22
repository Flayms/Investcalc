const euro = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const euroCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatEuro = (v: number) => euro.format(v);
export const formatEuroCompact = (v: number) => euroCompact.format(v);
export const formatPercent = (v: number, digits = 1) => `${(v * 100).toFixed(digits)} %`;
export const formatSignedPercent = (v: number, digits = 1) =>
  `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)} %`;
export const formatFactor = (v: number) => `${v.toFixed(2)}×`;
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (v: number) => compact.format(v);
/** Months as "8 mo" below two years, else years with one decimal. */
export const formatDuration = (months: number) =>
  months < 24 ? `${months} mo` : `${(months / 12).toFixed(1)} y`;
/** A gain as a signed percentage, or as a multiple ("×14") from +1,000 % on. */
export const formatGain = (v: number) =>
  v >= 10 ? `×${formatCompact(1 + v)}` : formatSignedPercent(v, Math.abs(v) >= 1 ? 0 : 1);
