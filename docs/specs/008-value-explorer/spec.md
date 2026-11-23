# 008 – Value explorer

**Status:** Implemented

## Goal

Users tuning a scenario want to know which value of a slider would have paid off, and what they
trade for it. Today only the leverage factor has an explorer, it always assumes 100 % in the
leveraged ETF and it only optimises the median. This spec adds an explorer for the three sliders
whose best value is not obvious — share in leveraged ETF, leverage factor and SMA window — lets the
user choose what "best" means, and ties each diagram visibly to its slider.

## Requirements

### REQ-008-01 Sweep of a slider

- **Given** the selected scenario
- **When** its results are shown
- **Then** for each explored slider (share in leveraged ETF 0–100 %, leverage factor 1×–3×, SMA
  window 50–250 trading days, REQ-015-06) the scenario is simulated on the same paths for a range of values covering
  the slider's range, with all other settings unchanged
- **And** each value reports the distribution of the final value after taxes (P5, P10, P25, P50,
  P75, P90, P95) and the chance of ending below the amount paid in

### REQ-008-02 Sweeps that need another setting

- **Given** a slider that has no effect with the scenario's current settings (leverage factor with
  0 % leveraged share, share with a 1× factor, SMA window with buy and hold)
- **When** it is explored
- **Then** the explorer assumes the smallest change that gives the slider an effect (100 %
  leveraged share, 2× factor, SMA strategy) and says so
- **And** the SMA window explorer also shows buy and hold as a reference

### REQ-008-03 Choosing what "best" means

- **Given** a sweep
- **When** the user picks a goal — highest median, best bad case (P10) or lowest chance of loss
- **Then** the explorer marks the best value for that goal, states it next to the current value in
  plain words, and ties are resolved by the higher median
- **And** the goal applies to all explored sliders

### REQ-008-04 Distribution and trade-off diagrams

- **Given** a sweep
- **When** it is shown
- **Then** one diagram shows the distribution of the final value (P5–P95, P10–P90, P25–P75 bands
  and the median) against the slider value, with the amount paid in, the current value and the
  best value marked
- **And** a second diagram shows the trade-off: median final value against chance of loss, one
  point per slider value, with the current and the best value highlighted

### REQ-008-05 Slider and diagram belong together

- **Given** an explored slider in the scenario settings
- **When** its sweep has results
- **Then** a small chart directly under the slider plots the chosen goal over exactly the slider's
  range, with the best value marked, so the curve lines up with the slider
- **And** a button applies the best value to the slider, and another opens the slider's diagram in
  the explorer
- **And** the explorer names each diagram by the slider's label and uses the same icon

## Out of scope

- Optimising two sliders jointly (e.g. share × leverage grid).
- Exploring costs, taxes or the savings plan sliders.

## Assumptions

- Sweeps use the same random paths as each other (up to 500 paths), so differences between
  values are not sampling noise.
- REQ-001-16 and REQ-002-04 (leverage explorer always at 100 % leveraged) are deprecated by this spec.

## Verification

| REQ        | Test                                                                                                                                             | Result |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| REQ-008-01 | `sweep.test.ts` › REQ-008-01 (covers the range, distribution + chance of loss, same as a plain run, error); e2e `REQ-008-01 / REQ-001-20 …`      | pass   |
| REQ-008-02 | `sweep.test.ts` › REQ-008-02 (100 % leveraged, 2×, SMA + buy-and-hold reference)                                                                 | pass   |
| REQ-008-03 | `sweep.test.ts` › REQ-008-03 (best per goal, ties by median); `App.test.tsx` › REQ-008-03 the goal applies to the explorer and the slider curves | pass   |
| REQ-008-04 | `App.test.tsx` › REQ-008-04 distribution and trade-off diagrams; `docs/screenshots/value-explorer*.png`                                          | pass   |
| REQ-008-05 | `App.test.tsx` › REQ-008-05 goal curve + "Use" under the slider; Explore opens the diagram; `docs/screenshots/slider-insight.png`                | pass   |
