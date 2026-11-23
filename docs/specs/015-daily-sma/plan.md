# 015 – Daily SMA signal: Plan

## Approach

Paths stay monthly; only SMA scenarios walk through the trading days of months that have them.

- **Data.** A dataset gets an optional `daily` block: first month, trading days per month, day of
  month and return of every trading day (flat arrays, compact JSON). `fetch-data.ts` writes it for
  the US total market (French daily, scaled per month to the monthly file's return) and MSCI
  (own daily net returns from 2001; French developed-market days from 1990-07 scaled to the
  monthly return). `eur.json` gets the daily euro/dollar change per fixing day.
  Size: about +45 KB (US market) and +25 KB per MSCI index, gzipped.
- **Currency.** `inCurrency` slices the daily block with the months and attaches each trading
  day's exchange rate change: the last fixing on or before the day, the last trading day of a
  month the month-end rate, so a month's days compound to the monthly change.
- **Paths.** `buildPaths` gives each history month typed-array views on its days (no copies per
  path).
- **Engine.** `simulatePath` keeps an n-day rolling average (ring buffer) of the index level in the
  investor's currency, fed with real days or 21 interpolated days for months without daily data.
  A month is split into segments at the switch days; `leveragedReturn` gets a `fraction` of the
  month for TER and financing, and each segment's variance is the sum of its squared daily log
  returns. A signal at a close becomes a pending switch executed at the next trading day's close,
  also across a month boundary. Months without days keep the month-end check (one-month lag for
  average prices). Buy and hold ignores days, so its speed is unchanged.
- **UI.** `smaMonths` becomes `smaDays` (slider 50–250, step 10, unit days); persistence converts
  old values. Explorer sweep 50–250 step 20. Help text and data basis say when the signal is
  checked. First-visit scenarios use the US total market.
- **Speed.** Measured before: a 3× SMA scenario (2,000 paths, 20 years) took ~200 ms; the daily
  walk adds ~100 ms. Accepted.

## Tasks

- [x] Spec, deprecate REQ-001-12, glossary (REQ-015-*)
- [x] Daily block in the dataset schema, scaling of daily returns, fetch script, eur daily (REQ-015-04, REQ-015-05)
- [x] Daily exchange rate per trading day in `inCurrency` (REQ-015-05)
- [x] Engine: n-day rolling SMA, next-close execution, segments within a month (REQ-015-01, REQ-015-02, REQ-015-03)
- [x] `smaDays` parameter, sweep values, persistence migration (REQ-015-06, REQ-015-07)
- [x] Help text and data basis (REQ-015-08), first-visit scenarios (REQ-015-09)
- [x] Docs: architecture, README, known pitfalls; screenshots
