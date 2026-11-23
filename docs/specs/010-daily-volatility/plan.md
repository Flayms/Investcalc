# 010 – Daily volatility and longer data basis: Plan

## Approach

Keep the engine monthly. The download script aggregates daily returns into one realised variance
per month and stores it as `variance` next to `returns` and `rates`; the engine reads it instead of
computing a trailing variance. The aggregation (daily → monthly return and variance, scaling for
months without daily data) is pure TypeScript in `src/simulation/daily.ts` so it is unit-tested.

Sources:

- US market (Mkt-RF + RF) and 1-month T-bill (RF): Kenneth French data library, returns and rates
  from the monthly file (the daily file rounds RF to 0.01 % a day), variance from the daily file.
- MSCI: the existing API with `data_frequency=DAILY`.
- S&P 500 (Shiller) keeps its monthly average returns; its variance comes from the US market's
  daily data from 1926-07, before that from the scaled squared monthly return (REQ-010-02).
- Short rate: TB3MS from 1934, 1-month T-bill 1926-07 to 1933, Shiller's long rate before.

The schema gets `variance` (required) and `dailyFrom` (first month with daily variance).

## Tasks

- [x] Spec (this folder)
- [x] `daily.ts`: monthly return and realised variance from daily returns, scaled estimate (REQ-010-01, REQ-010-02, REQ-010-05)
- [x] Engine uses the dataset's variance; drop the trailing variance (REQ-010-01)
- [x] Dataset schema: `variance`, `dailyFrom`; data basis shows "Daily data from" (REQ-010-02)
- [x] `fetch-data.ts`: French data library, MSCI daily, short rate 1926–1933, new `us-market` dataset (REQ-010-03, REQ-010-04, REQ-010-05)
- [x] Regenerate `public/data`, docs (README, architecture, glossary, pitfalls), screenshots
