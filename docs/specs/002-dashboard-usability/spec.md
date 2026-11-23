# 002 – Dashboard usability

**Status:** Implemented

## Goal

Users of the Monte Carlo dashboard (spec 001) lose their scenarios on every reload, have to keep
facts that are the same for everybody (taxes, product costs, the data period) in sync by hand
across scenarios, struggle to see which scenario wins, do not understand the leverage explorer and
find background information (current market, data basis) mixed into the results. This spec makes
the dashboard keep its state, separates the user's choices from shared assumptions and makes the
results easier to read.

## Requirements

### REQ-002-01 Scenarios survive a page reload

- **Given** the user has added, edited, renamed or removed scenarios, selected one and changed settings
- **When** the page is reloaded
- **Then** the same scenarios (names, settings, colors), the selected scenario and all shared settings are restored
- **And** if the stored state is missing, from an incompatible version or invalid, the default scenarios are shown instead of an error

### REQ-002-02 Shared settings

- **Given** several scenarios
- **When** the user changes the historical period, a TER, the SOFR switch, the financing spread,
  the order fee, the bid-ask spread or any German tax setting
- **Then** the change applies to all scenarios at once
- **And** these settings are edited once, in a card labelled as shared by all scenarios, and no
  longer appear in the scenario settings
- **And** the scenario settings only contain what the user chooses per scenario: name, index,
  monthly and initial investment, leveraged share and factor, timing strategy and the loan
  ("borrow from your future self")

### REQ-002-03 Color-coded final values

- **Given** two or more scenarios with results
- **When** the percentile table of the final value after taxes is shown
- **Then** each percentile cell is shaded on a single-hue scale within its column, from light (lowest value) to dark (highest value)
- **And** the highest value of each column is marked as best in text, not by color alone
- **And** on small screens, where results are shown as one card per scenario, the same shading and marks apply to the percentiles in the cards
- **And** with a single scenario no shading is applied

### REQ-002-04 Leverage explorer explains itself (deprecated)

> Deprecated by REQ-008-02 – REQ-008-04: the value explorer states the best value in plain words, no longer assumes 100 % leveraged and explains any assumption it has to make.

- **Given** the leverage explorer of the selected scenario has results
- **When** it is shown
- **Then** it states in plain words which factor gives the highest median and how its median and
  its bad case (P10) compare with 1×
- **And** the chart has labelled axes (leverage factor, final value after taxes), a legend for
  typical (median), bad (P10) and good (P90) outcomes, and a line for the amount paid in
- **And** it says that it always assumes 100 % in the leveraged ETF, independent of the scenario's mix

### REQ-002-05 Market and data basis apart from the results

- **Given** the dashboard has loaded
- **When** the user looks at the simulation results
- **Then** the current market and the data basis are not part of the results; they are on a separate "Market & data" view the user can switch to

## Out of scope

- Sharing state via URL, multiple saved workspaces, import/export
- Per-scenario overrides of shared settings

## Assumptions

- State is stored per browser (local storage); clearing site data resets it.
- The index stays per scenario so indices can be compared; the shared historical period is clamped
  to each index's available data.
- The loan rate stays per scenario next to the loan term (different loan products can be compared).

## Verification

| REQ        | Test                                                                                                                                                                                                                                                 | Result |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-002-01 | `persistence.test.ts` › REQ-002-01 (round trip, missing, invalid, other version); `scenario.test.ts` › new keys never collide; `App.test.tsx` › REQ-002-01 (restored after remount, corrupt state); e2e `REQ-002-01 scenarios survive a page reload` | pass   |
| REQ-002-02 | `scenario.test.ts` › REQ-002-02 merges shared settings; `App.test.tsx` › REQ-002-02 shared settings apply to all scenarios                                                                                                                           | pass   |
| REQ-002-03 | `heatmap.test.ts` › REQ-002-03; `App.test.tsx` › REQ-002-03 best value marked per percentile (table and cards)                                                                                                                                       | pass   |
| REQ-002-04 | deprecated → REQ-008-03, REQ-008-04                                                                                                                                                                                                                  | –      |
| REQ-002-05 | `App.test.tsx` › REQ-002-05 market and data basis on their own view; e2e `REQ-002-05 …`                                                                                                                                                              | pass   |
