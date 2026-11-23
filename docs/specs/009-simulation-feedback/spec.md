# 009 – Simulation feedback

**Status:** Implemented

## Goal

Users change settings while scrolled down to the charts, where the "Simulating…" hint in the
header is out of sight, so they cannot tell whether a chart is up to date. Fast slider changes
also queue up work that is already outdated. This spec makes progress visible wherever the user
is and keeps the app responsive.

## Requirements

### REQ-009-01 Progress visible from anywhere

- **Given** the user is scrolled anywhere on the simulation view, on any screen size
- **When** a simulation or analysis is running
- **Then** a status indicator stays in view and says what is running
- **And** it disappears when everything is up to date

### REQ-009-02 Outdated results are marked, not removed

- **Given** results are shown
- **When** they are being recalculated
- **Then** each affected card keeps its previous content, marks it as updating and dims it until
  the new results arrive

### REQ-009-03 Outdated work is skipped

- **Given** a calculation that has not started yet
- **When** the settings change again before it starts
- **Then** it is replaced by the calculation for the new settings instead of running both
- **And** the simulation of all scenarios runs before the analyses of the selected scenario

### REQ-009-04 Only affected scenarios are re-simulated

- **Given** simulated scenarios
- **When** the user changes something that does not affect a scenario's results (its name, the
  order, the visibility of another scenario, or another scenario's choices)
- **Then** that scenario is not simulated again, keeps its results, and is not marked as updating
- **And** a change to the shared or global settings still re-simulates every shown scenario

### REQ-009-05 Analyses only rerun when the selected scenario's inputs change

- **Given** the analyses of the selected scenario are shown
- **When** the user renames it, reorders or hides/shows scenarios, or edits another scenario
- **Then** the value explorer and cost factors are not recalculated and not marked as updating

### REQ-009-06 Showing a scenario again reuses its results

- **Given** a scenario was hidden and nothing that affects it changed since
- **When** it is shown again
- **Then** its results appear without a new simulation

## Out of scope

- Cancelling a calculation that has already started.
- Percent-complete progress.
- Remembering results of earlier settings (only the latest result per scenario is kept), and
  remembering the analyses of a scenario that is no longer selected.

## Assumptions

- Calculations run one at a time in a single Web Worker.
- A scenario's results depend only on its own settings (without its name), the shared and global
  settings and the historical data, never on the other scenarios.

## Verification

| REQ        | Test                                                                                                                                                                                                                               | Result |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-009-01 | `App.test.tsx` › REQ-009-01 (status says what runs; disappears when done); e2e `REQ-009-01 the status stays in view while scrolled down`                                                                                           | pass   |
| REQ-009-02 | `App.test.tsx` › REQ-009-02 results stay visible but marked while they are recalculated                                                                                                                                            | pass   |
| REQ-009-03 | `client.test.ts` › REQ-009-03 (queued request replaced, run before analyses, sweeps of different sliders kept)                                                                                                                     | pass   |
| REQ-009-04 | `App.test.tsx` › REQ-009-04 (renaming re-simulates nothing; editing one scenario re-simulates and marks only it; shared setting re-simulates all); `useSimulation.test.ts` › REQ-009-04 (name ignored, every other setting counts) | pass   |
| REQ-009-05 | `App.test.tsx` › REQ-009-05 renaming the selected scenario or hiding another does not rerun the analyses; REQ-009-04 renaming (no sweeps/factors)                                                                                  | pass   |
| REQ-009-06 | `App.test.tsx` › REQ-009-06 a scenario shown again reuses its results                                                                                                                                                              | pass   |
