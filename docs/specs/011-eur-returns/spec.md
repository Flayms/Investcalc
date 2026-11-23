# 011 – Returns in euros

**Status:** Implemented

## Goal

The app targets investors in Germany: amounts and taxes are in euros, but all index returns were
in US dollars, so the currency risk of holding US or world equities was ignored. For a German
investor the euro/dollar rate has added or removed several percentage points a year over long
stretches (e.g. the dollar lost half its value in DM between 1970 and 1980). This spec simulates
in euros by default, with the US dollar view still available.

## Requirements

### REQ-011-01 Currency setting

- **Given** the simulation settings
- **When** the user picks the currency, euro (default) or US dollar
- **Then** all scenarios are simulated in that currency
- **And** in euros, every fund's monthly return is converted with the change of the euro/dollar
  rate in the same month (month-end rates), so currency and market moves of a month stay together
  in historical windows and random slicing

### REQ-011-02 Leveraged ETFs in euros

- **Given** a leveraged ETF and the euro as currency
- **When** its monthly return is computed
- **Then** leverage, volatility drag and financing apply to the index return in US dollars, and the
  currency effect applies once (not leveraged), as for a dollar-based leveraged ETF held in euros

### REQ-011-03 Interest on cash in euros

- **Given** the euro as currency
- **When** cash earns interest (e.g. while an SMA strategy is out of the market)
- **Then** it earns the German 3-month money market rate (euro area after 1999) of that month,
  not the US T-bill rate

### REQ-011-04 History in euros

- **Given** the euro as currency
- **When** paths are generated
- **Then** only months for which the exchange rate and the euro short rate are known are used
  (from 1960; before 1999 via the D-Mark at the fixed 1.95583 DM per euro)
- **And** the historical period setting says from which year the history in euros starts

### REQ-011-05 SMA signal in the chosen currency

- **Given** the SMA strategy and the euro as currency
- **When** the signal is computed
- **Then** it compares the index level in euros with its moving average

### REQ-011-06 Saved state from before

- **Given** a dashboard state saved before the currency setting existed
- **When** the app loads it
- **Then** it is restored with the euro as currency

### REQ-011-07 Data basis

- **Given** the data basis
- **When** it is shown
- **Then** it names the source of the exchange rates and the euro short rate and the period they
  cover

## Out of scope

- Currency-hedged ETFs, leveraged ETFs whose leverage applies to returns in euros.
  Checked for the popular Amundi products (2026-11): the Nasdaq-100 2× fund (LQQ) tracks a USD
  leveraged index, as modelled. The MSCI USA 2× fund (CL2) lists EUR as benchmark currency, but
  whether its leverage applies to euro returns could not be confirmed; not modelled.
- Market view (current market, bear/bull markets) in euros; it stays in the index currency.
- Inflation adjustment.

## Assumptions

- Exchange rates: Deutsche Bundesbank, Frankfurt fixing DM per USD (until 1998) and the ECB
  euro reference rate (from 1999), last quote of each month.
- Euro short rate: OECD 3-month interbank rate for Germany (FRED IR3TIB01DEM156N), monthly average;
  the latest months without a value repeat the last known one.

## Verification

| REQ        | Test                                                                                                                                                                          | Result |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-011-01 | `portfolio.test.ts` › REQ-011-01; `currency.test.ts` › REQ-011-01 (2); `App.test.tsx` › REQ-011-01 euros by default; e2e `smoke.spec.ts` › REQ-011-01 switching to US dollars | pass   |
| REQ-011-02 | `portfolio.test.ts` › REQ-011-02 the currency effect of a leveraged ETF is not leveraged                                                                                      | pass   |
| REQ-011-03 | `portfolio.test.ts` › REQ-011-03 cash earns the cash rate of the month                                                                                                        | pass   |
| REQ-011-04 | `currency.test.ts` › REQ-011-04 (2); `App.test.tsx` › REQ-011-04 the historical period says from when the history in euros starts                                             | pass   |
| REQ-011-05 | `portfolio.test.ts` › REQ-011-05 the SMA signal follows the index level in the chosen currency                                                                                | pass   |
| REQ-011-06 | `persistence.test.ts` › REQ-011-06 state saved before the currency setting loads with the euro                                                                                | pass   |
| REQ-011-07 | `App.test.tsx` › REQ-011-07 the data basis names the exchange rate and euro short rate sources                                                                                | pass   |

Data check: MSCI World (USD) converted with the euro data vs. MSCI's own euro series, 2001-01 … 2026-10:
CAGR 6.65 % vs. 6.69 % p.a.; mean absolute monthly difference 0.35 % (different fixing times).
