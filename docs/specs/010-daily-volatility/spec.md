# 010 – Daily volatility and longer data basis

**Status:** Implemented

## Goal

Users comparing leveraged ETFs need a realistic volatility drag. The drag of a daily-reset fund
depends on the variance of _daily_ index returns, but it was estimated from a trailing 12-month
average of _monthly_ returns, which for the S&P 500 are additionally smoothed by monthly average
prices. Against 100 years of daily US market data this overstated the cost-free CAGR of a 3× fund
by up to ~5 percentage points a year (2001–2025: 21.7 % instead of 16.1 %). This spec bases the drag
on the realised daily variance of the same month, adds a US total market index with month-end
total returns since 1926, and replaces the long-term rate that stood in for the short rate before
1934 wherever a T-bill rate is known.

## Requirements

### REQ-010-01 Drag from the same month's daily variance

- **Given** a month for which daily index returns are known
- **When** the return of a leveraged ETF is computed for that month
- **Then** the volatility drag uses the realised variance of that month's daily log returns
  (sum of squared daily log returns), not a trailing or monthly estimate
- **And** for daily returns with clustered volatility the monthly leveraged return stays within
  0.5 % (log) of compounding the leveraged daily returns

### REQ-010-02 Months without daily data

- **Given** a month without daily data (S&P 500 before July 1926, and its latest months not yet
  published in the daily data)
- **When** its variance is needed
- **Then** it is estimated from that month's squared log return, scaled so that over the period
  where both are known the estimate and the realised daily variance have the same total
- **And** the data basis states for each index from which month daily data is used

### REQ-010-03 US total market since 1926

- **Given** the index selection
- **When** the user picks "US total market"
- **Then** the simulation uses the month-end total return of the US stock market (all listed
  stocks, value weighted) from July 1926, with daily variance for every month

### REQ-010-04 Short rate before 1934

- **Given** a month between July 1926 and December 1933
- **When** the short rate is needed (financing of leveraged ETFs, interest on cash)
- **Then** the 1-month T-bill rate is used instead of the long-term interest rate

### REQ-010-05 Daily variance for MSCI indices

- **Given** MSCI World or MSCI ACWI
- **When** the data is downloaded
- **Then** monthly returns are taken from the last daily level of each month and every month
  carries the realised variance of its daily returns

## Out of scope

- Simulating day by day (paths stay monthly).
- Daily SMA signals (e.g. 200-day), intra-month gap risk / fund knock-out.
- Currency conversion to EUR and inflation adjustment.
- Longer MSCI history (the MSCI API serves data only from 2000-12-29).

## Assumptions

- The daily variance of the S&P 500 is approximated by the US total market (CRSP via Kenneth
  French's data library); both have nearly the same volatility.
- Leveraged ETFs reset at the index close, so the daily index variance is the right input even for
  indices with constituents in several time zones.

## Verification

| REQ        | Test                                                                                                                                  | Result |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-010-01 | `daily.test.ts` › REQ-010-01 (aggregation, gaps, leveraged return within 0.5 % of daily compounding); `simulate.test.ts` › REQ-010-01 | pass   |
| REQ-010-02 | `daily.test.ts` › REQ-010-02 (scale, estimate); `App.test.tsx` › REQ-010-02 the data basis states from which month daily data is used | pass   |
| REQ-010-03 | `App.test.tsx` › REQ-010-03 the data basis lists the US total market from 1926-07; `bun run data:fetch` (1203 months from 1926-07)    | pass   |
| REQ-010-04 | `bun run data:fetch`: S&P 500 rates differ from before only in 1926-07 … 1933-12 (90 months, now 1-month T-bill)                      | pass   |
| REQ-010-05 | `bun run data:fetch`: MSCI monthly returns from daily levels identical to the former end-of-month series (max. difference 0)          | pass   |
