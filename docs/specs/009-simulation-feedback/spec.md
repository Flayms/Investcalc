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

## Out of scope

- Cancelling a calculation that has already started.
- Percent-complete progress.

## Assumptions

- Calculations run one at a time in a single Web Worker.

## Verification

| REQ        | Test                                                                                                                                     | Result |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| REQ-009-01 | `App.test.tsx` › REQ-009-01 (status says what runs; disappears when done); e2e `REQ-009-01 the status stays in view while scrolled down` | pass   |
| REQ-009-02 | `App.test.tsx` › REQ-009-02 results stay visible but marked while they are recalculated                                                  | pass   |
| REQ-009-03 | `client.test.ts` › REQ-009-03 (queued request replaced, run before analyses, sweeps of different sliders kept)                           | pass   |
