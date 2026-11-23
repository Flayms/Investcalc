# 001 – Monte Carlo dashboard

**Status:** Implemented

## Goal

A German retail investor wants to see how a monthly ETF savings plan would likely end up — with
leverage, costs, German taxes and timing strategies — based on real historical data instead of a
single assumed return. The dashboard simulates thousands of paths from historical data, shows the
distribution of outcomes as percentiles and lets the user compare several setting combinations
(scenarios) side by side, so they can pick the settings they actually control.

## Requirements

### Data basis

#### REQ-001-01 Historical datasets

- **Given** the app has loaded
- **When** the user opens the ETF selection of a scenario
- **Then** S&P 500, US total market (REQ-010-03), MSCI World and MSCI ACWI (All World) are available
- **And** each shows its source, available period, CAGR and volatility

#### REQ-001-02 Data period

- **Given** a scenario with an ETF
- **When** the user restricts the historical period (from/to year)
- **Then** only months inside that period are used to generate paths

### Path generation

#### REQ-001-03 Rolling historical windows

- **Given** sampling mode "historical windows" and a horizon of N months
- **When** a simulation runs
- **Then** every path is a contiguous N-month slice of the history, one per possible start month
- **And** if the period is shorter than the horizon, the user is told so instead of a result

#### REQ-001-04 Random slicing (block bootstrap)

- **Given** sampling mode "random slicing" with a mean block length B
- **When** a simulation runs with P paths and a seed
- **Then** every path is stitched together from random contiguous blocks of history (mean length B)
- **And** the same seed produces the same paths

### Products and costs

#### REQ-001-05 Leveraged ETF model

- **Given** a leverage factor L (1× – 3×)
- **When** the monthly return of the ETF is computed
- **Then** it equals L × the index return, minus the volatility drag of a daily reset,
  minus financing (SOFR + spread) on the borrowed (L − 1) part, minus TER
- **And** with L = 1 it equals the index return minus TER

#### REQ-001-06 SOFR toggle

- **Given** "include SOFR financing" is switched off
- **When** a leveraged ETF is simulated
- **Then** only the spread, not the SOFR part, of the financing cost is charged
- **And** the setting is flagged as not recommended (it only exists to show the influence of SOFR)

#### REQ-001-07 1× / leveraged mix

- **Given** a share W of each contribution going into the leveraged ETF
- **When** contributions are invested
- **Then** W goes into the leveraged ETF and 1 − W into the 1× ETF (0 % = only 1×, 100 % = only leveraged)

#### REQ-001-08 Trading costs

- **Given** an order fee per order and a bid-ask spread
- **When** an ETF is bought or sold
- **Then** the order fee and half the spread of the order value are deducted

### German taxes

#### REQ-001-09 Capital gains tax at sale

- **Given** taxes are enabled with rate T, partial exemption (Teilfreistellung) E and allowance (Sparerpauschbetrag) A
- **When** ETF units are sold with a gain
- **Then** tax = T × max(0, gain × (1 − E) − unused allowance of that year); losses are carried forward

#### REQ-001-10 Advance lump sum (Vorabpauschale)

- **Given** taxes are enabled and a base rate (Basiszins)
- **When** a simulated year ends
- **Then** value at the start of the year × base rate × 0.7, capped at the year's value gain, is taxed like a gain
- **And** it is not taxed again at sale

### Strategies

#### REQ-001-11 Savings plan (buy and hold)

- **Given** a monthly contribution and an optional initial investment
- **When** the strategy is buy and hold
- **Then** the contribution is invested on the same date every month and never sold before the end

#### REQ-001-12 SMA timing

**Deprecated:** replaced by REQ-015-01 (daily signal) and REQ-015-03 (months without daily data).

- **Given** the SMA strategy with a window of n months
- **When** the index closes a month below its n-month SMA
- **Then** all ETF holdings are sold into cash (earning the short rate), contributions are held in cash
- **And** when it closes above the SMA again, all cash is invested

#### REQ-001-13 Borrow from your future self

- **Given** "borrow from future self" with a loan term K months and loan rate i
- **When** the simulation starts
- **Then** the present value of K monthly contributions is borrowed and invested at once,
  the next K contributions repay the loan, afterwards contributions are invested normally
- **And** the outstanding loan is subtracted from the net worth

### Results

#### REQ-001-14 Percentiles

- **Given** a finished simulation
- **When** results are shown
- **Then** a chart shows the median and the P10–P90 band of net worth over time per scenario
- **And** a table shows P5/P10/P25/P50/P75/P95 of the final value after tax, the amount invested,
  the probability of ending below the invested amount, median fees and taxes paid

#### REQ-001-15 Multiple scenarios

- **Given** a scenario
- **When** the user adds, duplicates, renames or removes scenarios
- **Then** all scenarios are simulated on the same horizon and seed and compared in one chart and table

#### REQ-001-16 Best leverage factor (deprecated)

> Deprecated by REQ-008-01 – REQ-008-04: the value explorer sweeps the leverage factor with the scenario's own leveraged share.

- **Given** the selected scenario
- **When** the user runs the leverage explorer
- **Then** the scenario is simulated for leverage 1× – 3× (100 % leveraged) and median, P10 and P90 final value
  are plotted, marking the leverage with the highest median

#### REQ-001-20 Influence of factors

- **Given** the selected scenario
- **When** its results are shown
- **Then** for TER, SOFR financing, financing spread, trading costs and taxes the dashboard shows how much
  higher the median final value would be without that factor (financing only when leverage is used)

#### REQ-001-17 Parameter help

- **Given** any setting
- **When** the user hovers, clicks or taps its info icon
- **Then** a tooltip explains it and states the recommended value, and settings deviating from the
  recommendation are flagged

### Market status

#### REQ-001-18 Current market phase

- **Given** an ETF is selected
- **When** the dashboard is shown
- **Then** it shows the latest data month, the drawdown from the all-time high, the phase
  (bull / correction ≥ 10 % / bear ≥ 20 %) and whether the index is above its 6/10/12-month SMA

### Mobile

#### REQ-001-21 Readable on phones

- **Given** a phone-sized screen (≈ 390 px wide)
- **When** the dashboard is opened
- **Then** the page does not scroll sideways and no visible text is smaller than 12 px
- **And** the results come first, the settings are one tap away, and the percentiles of every scenario
  are readable without horizontal scrolling

### Publishing

#### REQ-001-19 GitHub Pages

- **Given** a push to `main`
- **When** CI has run
- **Then** the site is built and published on GitHub Pages

## Out of scope

- Optimiser over user-controlled parameters (planned; the leverage explorer is the first step)
- Daily data, intra-month execution dates, currency effects (EUR/USD), church tax, FIFO lots beyond full sales
- Rebalancing between the 1× and the leveraged ETF
- Inflation adjustment

## Assumptions

- Index returns are in USD and amounts are shown in €; currency effects are ignored.
- S&P 500 data uses Shiller's monthly _average_ prices, which smooth monthly returns.
- The 3-month T-bill rate (FRED TB3MS) is used as SOFR proxy; 1926–1933 the 1-month T-bill, before that the long-term rate (REQ-010-04).
- Volatility drag uses the realised variance of the same month's daily returns (spec 010).
- Leveraged ETFs are treated as equity funds (30 % Teilfreistellung).
- Taxes on the Vorabpauschale are paid from the next contributions.
- One simulated year = 12 months from the start; the allowance resets every simulated year.

## Verification

| REQ        | Test                                                                                                                                                | Result |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-001-01 | `App.test.tsx` › REQ-001-01 the data basis lists all indices…                                                                                       | pass   |
| REQ-001-02 | `simulate.test.ts` › REQ-001-02 rolling windows only use months inside the selected period                                                          | pass   |
| REQ-001-03 | `sampling.test.ts` › REQ-001-03 …; `simulate.test.ts` › too short history yields a message; e2e `REQ-001-03 historical windows on a short history…` | pass   |
| REQ-001-04 | `sampling.test.ts` › REQ-001-04 same seed / contiguous blocks with mean length                                                                      | pass   |
| REQ-001-05 | `leverage.test.ts` › REQ-001-05 (1× = index − TER, drag + financing, drag grows with variance, > −100 %)                                            | pass   |
| REQ-001-06 | `leverage.test.ts` › REQ-001-06 without SOFR only the spread is charged; `App.test.tsx` › REQ-001-06 SOFR switch flagged                            | pass   |
| REQ-001-07 | `portfolio.test.ts` › REQ-001-07 the leveraged share of a contribution goes into the leveraged ETF                                                  | pass   |
| REQ-001-08 | `portfolio.test.ts` › REQ-001-08 order fee and half the spread are charged on buys and the final sale                                               | pass   |
| REQ-001-09 | `tax.test.ts` › REQ-001-09 (exemption, allowance, loss carry-forward, disabled); `portfolio.test.ts` › final sale taxed                             | pass   |
| REQ-001-10 | `tax.test.ts` › REQ-001-10 (formula, cap); `portfolio.test.ts` › Vorabpauschale not taxed again at sale                                             | pass   |
| REQ-001-11 | `portfolio.test.ts` › REQ-001-11 sum of contributions / annuity due                                                                                 | pass   |
| REQ-001-12 | Deprecated, see REQ-015-01 / REQ-015-03                                                                                                             | –      |
| REQ-001-13 | `portfolio.test.ts` › REQ-001-13 (ends like savings plan, rising markets, loan repaid incl. interest)                                               | pass   |
| REQ-001-14 | `stats.test.ts`, `simulate.test.ts` › REQ-001-14 bands ordered; e2e `REQ-001-14 simulates the default scenarios in a worker…`                       | pass   |
| REQ-001-15 | `App.test.tsx` › REQ-001-15 duplicate/rename/remove; `simulate.test.ts` › same seed gives identical results                                         | pass   |
| REQ-001-16 | deprecated → REQ-008-01                                                                                                                             | –      |
| REQ-001-17 | `App.test.tsx` › REQ-001-17 every setting has help and deviations are flagged; e2e `mobile.spec.ts` › REQ-001-17 help opens on tap                  | pass   |
| REQ-001-18 | `market.test.ts` › REQ-001-18 (bull, bear, correction); `App.test.tsx` › REQ-001-18                                                                 | pass   |
| REQ-001-19 | Deploy workflow ran on `main` after PR #1; live site checked in a browser (simulation + analysis load, no page errors)                              | pass   |
| REQ-001-21 | e2e `mobile.spec.ts` › REQ-001-21 (no sideways scroll, ≥ 12 px text, results first, settings switcher)                                              | pass   |
| REQ-001-20 | `simulate.test.ts` › REQ-001-20 (never lowers the median, financing only with leverage)                                                             | pass   |
