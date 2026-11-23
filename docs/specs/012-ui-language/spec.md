# 012 – UI language (English / German)

**Status:** Implemented

## Goal

Most users of a tool for German investors and German tax law speak German. This spec lets every
user switch the dashboard between English and German, remembers the choice and opens a first visit
in the browser's language. Numbers follow the language, so a German UI does not show `€1,234.5`.

## Requirements

### REQ-012-01 Switch language

- **Given** the dashboard is shown in English
- **When** the user picks _Deutsch_ in the header
- **Then** all UI text (headings, labels, tooltips, buttons, tables, chart axes and legends, status
  and error messages, screen reader texts, the index descriptions of the data basis) is shown in
  German without a reload
- **And** the simulation results don't change and aren't recalculated
- **And** scenario names stay as they are (they are the user's data)
- **And** proper names (S&P 500, MSCI World, …) and German tax terms stay as they are

### REQ-012-02 Remember the choice

- **Given** the user picked a language
- **When** they reload the page
- **Then** the dashboard opens in that language

### REQ-012-03 Default from the browser

- **Given** a first visit with no stored choice
- **When** the browser's preferred language is German (`de`, `de-AT`, …)
- **Then** the dashboard opens in German, otherwise in English

### REQ-012-04 Localised numbers

- **Given** German is selected
- **When** amounts, percentages, factors, counts and durations are shown or typed
- **Then** they use German formatting (`1.234 €`, `800 Tsd. €`, `12,3 %`, `2,00×`, `2.000`,
  `8 Mon.` / `1,5 J.`, a decimal comma in the value boxes)
- **And** in English they stay as before (`€1,234`, `€800K`, `12.3 %`, `2.00×`, `8 mo` / `1.5 y`)

### REQ-012-05 Document language

- **Given** a language is selected
- **When** the page is rendered
- **Then** `<html lang>` matches it (`en` / `de`) from the first paint on, so screen readers and
  hyphenation follow it

### REQ-012-06 Default scenarios in the first visit's language

- **Given** a first visit (no saved dashboard)
- **When** the dashboard opens in German
- **Then** the default scenarios are named in German (e.g. "1× Buy and Hold"), and new and
  duplicated scenarios get German names ("Szenario 4", "… (Kopie)") while German is selected
- **And** switching the language later never renames existing scenarios (REQ-012-01)

## Out of scope

- Languages other than English and German.
- Translating the data source citations' proper names and series codes (they stay as published).
- Persisting the language in the dashboard state (it has its own storage key, like the theme).

## Assumptions

- German text addresses the user as _du_, like most German consumer finance apps.
- German domain terms follow the German column of `docs/glossary.md`.

## Verification

| REQ        | Test                                                                                                                                                                                                                                                                                                                                                                                | Result |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-012-01 | `messages.test.ts` › REQ-012-01 (3: same keys, no empty text, English data texts equal the data files); `App.test.tsx` › REQ-012-01 / REQ-012-05 switching to German translates the UI without recalculating; `simulate.test.ts` › REQ-001-20 (factors carry IDs, no labels); e2e `smoke.spec.ts` › REQ-012-01 / REQ-012-02; e2e `mobile.spec.ts` › REQ-012-01 German on phones (2) | pass   |
| REQ-012-02 | `language.test.ts` › REQ-012-02 (2); `App.test.tsx` › REQ-012-02 the chosen language survives a reload; e2e `smoke.spec.ts` › REQ-012-01 / REQ-012-02                                                                                                                                                                                                                               | pass   |
| REQ-012-03 | `language.test.ts` › REQ-012-03; `App.test.tsx` › REQ-012-03 (2); e2e `smoke.spec.ts` › REQ-012-03 a first visit with a German browser opens in German                                                                                                                                                                                                                              | pass   |
| REQ-012-04 | `format.test.ts` › REQ-012-04 (2); `FieldControl.test.tsx` › REQ-012-04 decimal comma and German units; `App.test.tsx` › REQ-012-04 German results use German number formats                                                                                                                                                                                                        | pass   |
| REQ-012-05 | `language.test.ts` › REQ-012-05; `App.test.tsx` › REQ-012-01 / REQ-012-05; e2e `smoke.spec.ts` › REQ-012-01 / REQ-012-02 (`<html lang>` after reload, set by `index.html`)                                                                                                                                                                                                          | pass   |
| REQ-012-06 | `App.test.tsx` › REQ-012-03 a first visit with a German browser opens in German (German default scenario names)                                                                                                                                                                                                                                                                     | pass   |

English screenshots compared pixel by pixel with `main`: unchanged except the new EN/DE switch in the
header (and an animated spinner frame).
