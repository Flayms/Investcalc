export type Language = "en" | "de";

const LOCALE: Record<Language, string> = { en: "en-US", de: "de-DE" };
const DURATION_UNITS: Record<Language, { months: string; years: string }> = {
  en: { months: "mo", years: "y" },
  de: { months: "Mon.", years: "J." },
};

export type Format = {
  euro: (v: number) => string;
  euroCompact: (v: number) => string;
  /** A fraction as percent with a space before the sign: 0.123 → "12.3 %". */
  percent: (v: number, digits?: number) => string;
  signedPercent: (v: number, digits?: number) => string;
  factor: (v: number) => string;
  compact: (v: number) => string;
  /** Whole numbers with thousands separators, e.g. path counts. */
  count: (v: number) => string;
  /** A plain number with a fixed number of decimals. */
  number: (v: number, digits: number) => string;
  /** Months as "8 mo" below two years, else years with one decimal. */
  duration: (months: number) => string;
  /** A gain as a signed percentage, or as a multiple ("×14") from +1,000 % on. */
  gain: (v: number) => string;
};

/** Number formats of a language (REQ-012-04); English is the en-US format used before. */
export function createFormat(language: Language): Format {
  const locale = LOCALE[language];
  const euro = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const euroCompact = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const fixed = new Map<number, Intl.NumberFormat>();
  // Without grouping, like the `toFixed` output used before: "1234.5 %".
  const number = (v: number, digits: number) => {
    let f = fixed.get(digits);
    if (!f) {
      f = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: false,
      });
      fixed.set(digits, f);
    }
    return f.format(v);
  };
  const percent = (v: number, digits = 1) => `${number(v * 100, digits)} %`;
  const signedPercent = (v: number, digits = 1) => `${v >= 0 ? "+" : ""}${percent(v, digits)}`;
  const units = DURATION_UNITS[language];
  return {
    euro: (v) => euro.format(v),
    euroCompact: (v) => euroCompact.format(v),
    percent,
    signedPercent,
    factor: (v) => `${number(v, 2)}×`,
    compact: (v) => compact.format(v),
    count: (v) => count.format(v),
    number,
    duration: (months) =>
      months < 24 ? `${months} ${units.months}` : `${number(months / 12, 1)} ${units.years}`,
    gain: (v) =>
      v >= 10 ? `×${compact.format(1 + v)}` : signedPercent(v, Math.abs(v) >= 1 ? 0 : 1),
  };
}
