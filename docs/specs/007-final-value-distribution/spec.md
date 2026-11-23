# 007 – Final value distribution

**Status:** Implemented

## Goal

The results table lists the final value after taxes at a handful of percentiles (P5 … P95). Reading
six numbers per scenario and comparing them across scenarios is hard; a picture of the whole
distribution makes it obvious where one scenario beats another and how wide its range is. Amounts
are also hard to compare across horizons and contributions, so users can switch the percentiles to
a yearly return.

## Requirements

### REQ-007-01 Final value against percentile

- **Given** simulated scenarios
- **When** the results are shown
- **Then** a chart plots the final value after taxes (vertical) against the percentile from P1 to
  P99 (horizontal), one line per visible scenario in its color and in the scenario order
- **And** a dashed reference line shows the amount paid in by the selected scenario
- **And** hovering a percentile shows every scenario's value at that percentile

### REQ-007-02 Percentiles as yearly return

- **Given** the results
- **When** the user switches the unit from "€" to "% p.a."
- **Then** the percentile columns of the results table (and the cards on small screens) show the
  money-weighted yearly return of that percentile instead of the amount
- **And** the distribution chart shows the yearly return on its vertical axis
- **And** shading and the best marker compare the shown values
- **And** switching back to "€" shows the amounts again; "€" is the default

## Out of scope

- Remembering the chosen unit across reloads.
- Showing the other columns (paid in, fees, taxes) as returns.

## Assumptions

- The yearly return of a percentile is computed the same way as the existing "Median p.a." column
  (money-weighted, savings plan treated as an annuity), just from that percentile's final value.
- P1 and P99 are the outermost percentiles shown; the extremes are too noisy to be useful.

## Verification

| REQ        | Test                                                                                                                                                                                         | Result |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-007-01 | `simulate.test.ts` › REQ-007-01 final value for every percentile P1–P99; `App.test.tsx` › REQ-007-01 chart with a line per scenario and paid in; chart in `docs/screenshots/percentiles.png` | pass   |
| REQ-007-02 | `annualReturn.test.ts` › REQ-007-02 (lump sum, break-even, monotonic, total loss); `App.test.tsx` › REQ-007-02 percentiles as yearly return (table, cards, chart, back to €)                 | pass   |
