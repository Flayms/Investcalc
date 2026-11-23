# 015 – Daily SMA signal

**Status:** Implemented

## Goal

The SMA trend filter is mostly used to limit the crashes of leveraged ETFs. It was checked once a
month on month-end closes (10-month SMA), while the rule investors actually follow is the
200-day line, checked at every close. A backtest on 100 years of daily US data (2,000 random
20-year paths, 3× ETF, costs and German taxes) showed that the difference is large: the daily rule
was better on 76 % of the paths, by 2.5 percentage points a year after tax in the median and
4 points at P5, with about 10 points smaller drawdowns. Checking a 200-day average only at month
end gave the same results as the 10-month rule, so it is the daily check, not the window, that
matters. This spec checks the SMA signal daily wherever daily index data exists.

## Requirements

### REQ-015-01 Daily signal

- **Given** the SMA strategy with a window of n trading days and a month for which daily index
  closes are known
- **When** the index closes below the average of its last n daily closes
- **Then** all ETF holdings are sold at the close of the next trading day, and contributions are
  held in cash (earning the short rate)
- **And** when it closes above the average again, all cash is invested at the close of the next
  trading day
- **And** the index level and its average are in the scenario's currency (REQ-011-05)

### REQ-015-02 Selling or buying within a month

- **Given** a switch on a trading day within a month
- **When** the month's returns are computed
- **Then** the funds earn only the index returns of the trading days they are held, with the
  volatility drag of those days, and the TER and financing costs pro rata to the trading days held
- **And** cash earns interest pro rata to the trading days it is held
- **And** the gain realised by a sale is taxed in the year of the sale (as before)

### REQ-015-03 Months without daily data

- **Given** a month without daily index closes (S&P 500, MSCI before July 1990)
- **When** the signal is checked
- **Then** it is checked once, at the month's close, and acted on at that close (with monthly
  average prices one month later, as before)
- **And** for the average such a month counts as 21 trading days whose levels grow evenly from
  the previous month's close to its own close

### REQ-015-04 Daily index data

- **Given** an index
- **When** daily closes are needed for the signal
- **Then** the US total market uses its daily returns from July 1926; MSCI World and MSCI ACWI use
  their own daily net returns from 2001 and the daily returns of developed markets from July 1990;
  the S&P 500 (monthly average prices) has none
- **And** the daily returns of a month compound to that month's return of the index

### REQ-015-05 Daily exchange rate

- **Given** the euro as currency and a month with daily index closes
- **When** the signal and the value of a switch are computed
- **Then** each trading day uses the euro/dollar rate of the last fixing on or before that day
- **And** the daily currency changes of a month compound to that month's change (month-end rates)

### REQ-015-06 Window in trading days

- **Given** the SMA strategy
- **When** the user sets the SMA window
- **Then** it is a number of trading days from 50 to 250 in steps of 10, 200 by default
- **And** the value explorer sweeps it from 50 to 250 in steps of 20

### REQ-015-07 Saved state from before

- **Given** a dashboard state saved with an SMA window in months
- **When** the app loads it
- **Then** the window is converted to trading days (21 per month, rounded to 10, within 50–250)

### REQ-015-08 Explaining when the signal is checked

- **Given** the SMA window setting and the data basis
- **When** they are shown
- **Then** the help of the SMA window says that the signal is checked at every daily close and
  acted on at the next close, and once a month in months without daily data
- **And** the data basis states for each index from which month the signal is checked daily, or
  that it is checked monthly

### REQ-015-09 First-visit scenarios on the US total market

- **Given** a first visit
- **When** the initial scenarios are created
- **Then** they use the US total market, so the SMA example scenario is checked daily for its
  whole history

## Out of scope

- Daily signals for the S&P 500: Shiller's data are monthly averages. The US total market (daily
  since 1926, correlation with the S&P 500 above 0.99) is the index for daily SMA.
- Fund knock-out of leveraged ETFs on extreme days, intraday stops.
- Other trend rules (buffers around the SMA, two-SMA crossovers, EMA).
- The market view's SMA indicators (6/10/12 months) stay monthly.

## Assumptions

- Leveraged ETFs and the index can be traded at the daily close; a signal at one close is acted on
  at the next close, so no trade uses a price that was not known when the signal was given.
- The volatility drag of a part of a month follows from the realised variance of its trading days
  (same model as REQ-010-01).
- The Frankfurt fixing (around 13:00 CET) is taken as the exchange rate of the US close of the same
  day.
- Developed-market daily returns (Kenneth French) stand in for the daily shape of MSCI World and
  ACWI between July 1990 and 2000; they are scaled to the index's monthly return.

## Verification

| REQ        | Test                                                                                                                                               | Result |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-015-01 | `portfolio.test.ts` › REQ-015-01 (sells / buys at the next close, signal on a month's last day, no crossing = buy and hold)                        | pass   |
| REQ-015-02 | `portfolio.test.ts` › REQ-015-02 (drag, TER, financing and interest pro rata; gain taxed in the year of the sale); `leverage.test.ts` › REQ-015-02 | pass   |
| REQ-015-03 | `portfolio.test.ts` › REQ-015-03 (month-end check, one-month lag for averages, 21 interpolated days)                                               | pass   |
| REQ-015-04 | `daily.test.ts` › REQ-015-04 (block layout, days compound to the month, gaps rejected)                                                             | pass   |
| REQ-015-05 | `currency.test.ts` › REQ-015-05 (last fixing on or before the day, days compound to the month, euro datasets); `portfolio.test.ts` › REQ-015-05    | pass   |
| REQ-015-06 | `sweep.test.ts` › REQ-015-06 the SMA window is swept from 50 to 250 trading days                                                                   | pass   |
| REQ-015-07 | `persistence.test.ts` › REQ-015-07 an SMA window saved in months loads in trading days                                                             | pass   |
| REQ-015-08 | `messages.test.ts` › REQ-015-08 the SMA window help says when the signal is checked; `App.test.tsx` › REQ-015-08 the data basis states …           | pass   |
| REQ-015-09 | `scenario.test.ts` › REQ-015-09 the first-visit scenarios use the US total market                                                                  | pass   |

Data check (generated files): the daily returns of every month compound to the month's return
within 1e-6 (log) for the US total market, MSCI World and MSCI ACWI, and the daily fixings to the
monthly exchange rate change within 1e-6.

Speed (Bun, 2,000 paths × 20 years, euros, 3× ETF): buy and hold 262 ms, 200-day SMA 425 ms;
SMA window explorer (11 values × 500 paths) 1.2 s.
