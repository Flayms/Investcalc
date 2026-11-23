# 012 – UI language: Plan

## Approach

Own small typed dictionary and a React context instead of an i18n library: two languages, no plural
or ICU needs, and TypeScript catches a missing German key at compile time.

- `src/features/i18n/messages/en.ts` is the source dictionary; `Messages = typeof en`. `de.ts` is
  typed `Messages`, so a missing or extra key fails the typecheck. Texts with values are functions
  that take already formatted values, so number formats stay in one place.
- `I18nProvider` (in `App`) holds the language: stored choice (`investcalc:language`), else the
  browser's first preferred language. It provides `t` (the dictionary) and `format` (number
  formats of the language). Without a provider, `useI18n()` returns English, so components still
  render alone in tests.
- `src/lib/format.ts` becomes `createFormat(language)`: Intl with `en-US` / `de-DE`, the same
  output as before in English. German thousands are abbreviated `Tsd.` (Intl has no short form).
- `fields.ts` keeps keys, ranges and recommendation checks; labels, help, recommendations and select
  option labels move to `t.fields[key]`, group titles to `t.groups[id]`.
- Engine returns IDs instead of text: factor IDs (no label), time frame IDs (`5y`, `max`), the
  sweep reference as a strategy, and errors as `SimulationError` objects. The UI words them.
- Data files keep their English texts; `t.datasets[id]` translates names, descriptions and sources,
  and a unit test keeps the English dictionary equal to the files.
- `index.html` sets `<html lang>` before first paint, like the theme.
- Playwright pins `locale: en-US`, so existing English tests don't depend on the machine.

## Tasks

- [x] Spec and plan (this folder)
- [x] `createFormat(language)` with German formats (REQ-012-04)
- [x] Language detection, storage, `<html lang>` (REQ-012-02, REQ-012-03, REQ-012-05)
- [x] Dictionaries `en` / `de`, provider and hook, `LanguageToggle` in the header (REQ-012-01)
- [x] Engine: IDs for factors, time frames, sweep reference, errors (REQ-012-01)
- [x] Translate every component, `fields.ts`, value boxes (REQ-012-01, REQ-012-04)
- [x] Default scenario names in the first visit's language (REQ-012-06)
- [x] Inline script in `index.html` (REQ-012-05)
- [x] Tests: unit, component, e2e (desktop + German on phones); German screenshots
- [x] Docs: spec index, architecture, glossary (German column), README, pitfalls
