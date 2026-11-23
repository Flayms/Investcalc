# 013 – Inflation-adjusted results

**Status:** Implemented

## Goal

Over 20–30 years, inflation of 2–3 % a year roughly halves what a euro buys. A final value of
"€500k" means far less than it suggests, and a nominal gain can be a loss of purchasing power.
This spec shows results in purchasing power at the start of the investment, using the inflation
of the same historical months as the returns.

## Requirements

### REQ-013-01 Inflation-adjusted results

- **Given** the simulation settings
- **When** "Adjust for inflation" is on (default)
- **Then** every amount in the results (net worth over time, final value after taxes,
  distribution, amount paid in, fees, taxes, value explorer, factor costs) is expressed in
  purchasing power at the start of the investment
- **And** each amount is deflated with the price level of the month it refers to, following the
  inflation of the same historical months as the returns (so inflation stays consistent with
  market moves, interest rates and exchange rates in historical windows and random slicing)
- **And** when it is off, all amounts are nominal, as before

### REQ-013-02 Inflation of the investor's currency

- **Given** the currency setting
- **When** amounts are inflation-adjusted
- **Then** euro simulations use German consumer prices and US dollar simulations US consumer prices

### REQ-013-03 Loss of purchasing power

- **Given** inflation-adjusted results
- **When** the chance of loss is computed
- **Then** a path counts as a loss if its final value after taxes buys less than the amount paid
  in, each payment valued at the time it was made

### REQ-013-04 Taxes stay nominal

- **Given** inflation-adjusted results
- **When** taxes are computed
- **Then** they are computed on nominal gains, as German tax law does, and only converted for
  display

### REQ-013-05 Yearly return

- **Given** inflation-adjusted results
- **When** the yearly return (% p.a.) is shown
- **Then** it is the real yearly return: the one that turns the inflation-adjusted amount paid in
  into the inflation-adjusted final value

### REQ-013-06 Saying what is shown

- **Given** inflation-adjusted results
- **When** the results are shown
- **Then** the net worth chart and the results table say that amounts are in purchasing power at
  the start
- **And** a dashboard saved before this setting existed loads with it switched on

## Out of scope

- Raising contributions with inflation (dynamic savings plan).
- Inflation in the market view.

## Assumptions

- US consumer prices: Shiller's CPI until 1946, FRED CPIAUCSL (seasonally adjusted) from 1947.
- German consumer prices: OECD CPI for Germany (FRED DEUCPIALLMINMEI) until its last month, then the
  harmonised index HICP (FRED CP0000DEM086NEST).
- Months after the last published price level repeat the last known monthly inflation rate.
- The yearly return treats the inflation-adjusted amount paid in as evenly spread over the
  months (approximation; real contributions shrink slightly over time).

## Verification

| REQ        | Test                                                                                                                                                                | Result |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-013-01 | `portfolio.test.ts` › REQ-013-01 amounts are deflated with the price level of their month; `App.test.tsx` › REQ-013-01 inflation-adjusted by default and switchable | pass   |
| REQ-013-02 | `currency.test.ts` › REQ-013-02 euro paths carry German inflation, dollar paths US inflation                                                                        | pass   |
| REQ-013-03 | `portfolio.test.ts` › REQ-013-03 each payment counts with its purchasing power; `simulate.test.ts` › REQ-013-03 chance of loss per path                             | pass   |
| REQ-013-04 | `portfolio.test.ts` › REQ-013-04 taxes are computed on nominal gains                                                                                                | pass   |
| REQ-013-05 | `annualReturn.test.ts` › REQ-013-05 (real amount paid in spread over the months; nominal unchanged)                                                                 | pass   |
| REQ-013-06 | `App.test.tsx` › REQ-013-01 (note in chart and table); `persistence.test.ts` › REQ-013-06                                                                           | pass   |
