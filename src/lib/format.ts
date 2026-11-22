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
