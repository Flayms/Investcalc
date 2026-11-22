# 006 – Market history and indicators

**Status:** Implemented

## Goal

The "Market & data" view only shows the last five years of an index and whether it is in a bull
market, a correction or a bear market today. Investors deciding on lump sum vs. DCA, SMA timing or
leverage want context: how deep and how long past bear markets were, how long recoveries took, how
far the current bull market has run, and how volatile the market and how high interest rates are
right now. This spec lets users change the chart's time frame, shows historic bear and bull markets,
and adds a few key indicators.

## Requirements

### REQ-006-01 Changeable time frame

- **Given** the "Market & data" view
- **When** the user picks a time frame (1, 3, 5, 10, 20 or 50 years, or the whole history)
- **Then** the chart shows the selected index over that time frame, rebased to 100 at its start
- **And** 5 years is preselected
- **And** time frames longer than the index's history cannot be picked

### REQ-006-02 Readable long time frames

- **Given** a time frame longer than 10 years
- **When** the chart is shown
- **Then** it uses a logarithmic scale, so equal percentage moves have equal height, and says so

### REQ-006-03 Statistics of the time frame

- **Given** a selected time frame
- **When** the chart is shown
- **Then** the total return, the annualised return (CAGR), the annualised volatility and the
  maximum drawdown of the index over that time frame are shown

### REQ-006-04 Historic bear markets

- **Given** an index's history
- **When** the index falls 20 % or more below its all-time high before recovering it
- **Then** that decline is listed as a bear market with its peak month, trough month, decline,
  months from peak to trough and months from peak until the all-time high was regained
- **And** a bear market that has not recovered yet is marked as ongoing
- **And** bear markets are shaded in the chart
- **And** only bear markets overlapping the selected time frame are listed

### REQ-006-05 Bull markets

- **Given** an index's history with at least one bear market
- **When** the market view is shown
- **Then** the current bull market (since the last bear market's trough) is shown with its start
  month, gain and length, unless a bear market is ongoing
- **And** the median gain and length of past bull markets (from a bear market's trough to the next
  bear market's peak) are shown

### REQ-006-06 Key indicators

- **Given** an index
- **When** the market view is shown
- **Then** it shows the trailing 1-, 3-, 5- and 10-year returns (annualised beyond 1 year)
- **And** the realised volatility of the last 12 months next to the long-term volatility
- **And** the current short rate (SOFR proxy)

## Out of scope

- Valuation indicators (CAPE, P/E, dividend yield): not in the dataset for all indices.
- Sentiment or macro indicators (VIX, yield curve, unemployment).
- Daily data: phases are based on monthly values, so declines are smaller than in daily closes.
- Remembering the time frame across reloads.

## Assumptions

- Bear and bull markets use the same all-time-high definition as the market phase (REQ-001-18): a
  bear market runs from an all-time high to the lowest point before that high is regained, and
  counts if that point is 20 % or more below the high.
- All values are total returns in USD, like the rest of the market view.

## Verification

| REQ        | Test                                                                                                                                                                         | Result |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-006-01 | `market.test.ts` › REQ-006-01 (rebased series, whole history, unavailable time frames); `App.test.tsx` › REQ-006-01 (5 years preselected, change; disabled for MSCI World)   | pass   |
| REQ-006-02 | `App.test.tsx` › `REQ-006-02 time frames over 10 years use a log scale`                                                                                                      | pass   |
| REQ-006-03 | `market.test.ts` › `REQ-006-03 statistics of the time frame`; `App.test.tsx` › REQ-006-03; `format.test.ts` › REQ-006-03                                                     | pass   |
| REQ-006-04 | `market.test.ts` › REQ-006-04 (≥ 20 % declines, 15 % dip); `App.test.tsx` › REQ-006-04 (listed per time frame, ongoing); e2e `mobile.spec.ts` › REQ-006-04 (fits on a phone) | pass   |
| REQ-006-05 | `market.test.ts` › REQ-006-05 (past and current bull markets); `App.test.tsx` › REQ-006-05                                                                                   | pass   |
| REQ-006-06 | `market.test.ts` › REQ-006-06; `App.test.tsx` › REQ-006-06                                                                                                                   | pass   |
