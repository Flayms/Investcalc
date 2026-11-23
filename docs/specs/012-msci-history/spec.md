# 012 – MSCI history before 2001

**Status:** Implemented

## Goal

MSCI World and MSCI ACWI only covered 2001 onward because MSCI's public data service serves net
returns from 2000-12-29 only. Both indices have a much longer history (World since 1969, ACWI
since 1987) with eras the simulation should know: the 1970s, the 1987 crash, Japan's bubble and
the dot-com boom. This spec extends both with MSCI's gross total return history.

## Requirements

### REQ-012-01 Longer history

- **Given** MSCI World or MSCI ACWI
- **When** the data basis or a simulation uses it
- **Then** MSCI World starts in January 1970 and MSCI ACWI in January 1988
- **And** from 2001 the returns are MSCI's net total returns, as before

### REQ-012-02 Net returns before 2001

- **Given** a month before 2001, where MSCI publishes gross total returns only
- **When** its return is used
- **Then** the gross return is reduced by the average yearly gap between gross and net returns
  measured where both are known (2001 onward), so the whole history is comparable to an ETF
  holding the index (dividends after withholding tax)

### REQ-012-03 Variance before 2001

- **Given** a month before MSCI's daily data (2001)
- **When** its variance is needed for the volatility drag
- **Then** it is the realised variance of the daily returns of developed markets (Kenneth French
  data library) from July 1990, and before that estimated as in REQ-010-02, calibrated on the
  index's own months with daily data
- **And** the data basis states from which month daily data is used

## Out of scope

- MSCI ACWI before 1988 (does not exist), emerging markets alone.

## Assumptions

- Gross total return history (USD, end of month): MSCI end-of-day data as exported in the public
  repository NandayDev/MSCI-Historical-Data (`indexes_gross`), pinned to one commit. It matches
  MSCI's gross series from MSCI's data service exactly for 2001-01 … 2023-06.
- The withholding-tax gap was larger when dividend yields were higher (1970s–1990s); a constant
  gap slightly overstates net returns before 2001.

## Verification

| REQ        | Test                                                                                                                                                     | Result |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-012-01 | `App.test.tsx` › REQ-012-01 MSCI World starts in 1970 and MSCI ACWI in 1988; `bun run data:fetch` (World 682 months from 1970-01, ACWI 466 from 1988-01) | pass   |
| REQ-012-02 | `history.test.ts` › REQ-012-02 (gap, net from gross, overlap only); measured gap 0.52 % p.a. (World), 0.51 % p.a. (ACWI)                                 | pass   |
| REQ-012-03 | `App.test.tsx` › REQ-012-01 (daily data from 1990-07), REQ-010-02 (estimate, scale); variance scale 1.08 (World), 1.00 (ACWI)                            | pass   |

Data check: the history matches MSCI's gross series from MSCI's data service exactly (max. monthly difference 0) for
2001-01 … 2023-06, for both indices.
