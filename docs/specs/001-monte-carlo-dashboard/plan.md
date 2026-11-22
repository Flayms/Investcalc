# 001 – Monte Carlo dashboard: Plan

## Approach

- **Data:** `scripts/fetch-data.ts` downloads Shiller S&P 500, MSCI World/ACWI (net TR, USD) and FRED
  TB3MS once and writes compact monthly JSON to `public/data/` (committed, so the site is static).
  Loaded with TanStack Query and validated with Zod.
- **Engine (`src/simulation/`):** pure TypeScript, no React. Every path is a list of month indices into
  the history (12 warm-up months for SMA signals + horizon). Rolling windows enumerate all start months;
  random slicing uses a circular _stationary block bootstrap_ (Politis & Romano): blocks of geometric
  length with mean B keep crash clustering, volatility regimes and the link between returns and rates,
  which i.i.d. month sampling would destroy — important for leverage and SMA strategies.
- **Leverage:** log return `L·x − (L²−L)/2·σ² − (L−1)·(SOFR+spread)/12 − TER/12`, the continuous-time
  result for a daily-reset fund; σ² is the trailing 12-month realised variance of the history at that month.
- **Portfolio:** month loop with cash, two funds (1×, leveraged) tracked as value + cost basis +
  already-taxed Vorabpauschale, a loan for "borrow from future self", and a yearly German tax settlement
  (loss carry-forward → allowance → rate). Liquidation at the end gives the after-tax final value.
- **Worker:** `src/simulation/worker.ts` runs all scenarios and the leverage sweep off the main thread.
- **UI:** one dashboard page — market status, scenario tabs with grouped settings (tooltips with
  recommended values), fan chart, percentile table, leverage explorer, data basis.
- **Deploy:** GitHub Actions builds with relative base path and publishes to GitHub Pages.

## Tasks

- [x] Data download script and datasets (REQ-001-01)
- [x] Seeded RNG, rolling windows and block bootstrap (REQ-001-02, REQ-001-03, REQ-001-04)
- [x] Leveraged return model with SOFR toggle (REQ-001-05, REQ-001-06)
- [x] German tax helpers (REQ-001-09, REQ-001-10)
- [x] Portfolio path simulation: mix, costs, strategies, loan (REQ-001-07, -08, -11, -12, -13)
- [x] Aggregation into percentiles, leverage sweep (REQ-001-14, REQ-001-16)
- [x] Market status (REQ-001-18)
- [x] Dashboard UI: scenarios, settings with tooltips, charts, tables (REQ-001-01, -14, -15, -17)
- [x] GitHub Pages workflow (REQ-001-19)
