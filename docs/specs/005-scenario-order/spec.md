# 005 – Scenario order

**Status:** Implemented

## Goal

Users comparing several scenarios want related ones next to each other, e.g. a variant right after
its original. Today scenarios stay in the order they were created. This spec lets users reorder
scenarios; the chart legend and the results table follow that order.

## Requirements

### REQ-005-01 Reordering by dragging

- **Given** several scenarios
- **When** the user drags a scenario's tab onto another scenario's tab
- **Then** the dragged scenario takes that scenario's position and the others shift
- **And** each scenario keeps its color, settings and visibility

### REQ-005-02 Reordering without a mouse

- **Given** a selected scenario
- **When** the user presses "Move left" or "Move right"
- **Then** the selected scenario swaps places with its neighbour and stays selected
- **And** "Move left" is disabled for the first scenario, "Move right" for the last

### REQ-005-03 Results follow the order

- **Given** reordered scenarios
- **When** the results are shown
- **Then** the chart legend and the results table list the scenarios in the order of the scenario bar
- **And** the order is kept across reloads

## Out of scope

- Sorting scenarios automatically (e.g. by median result).
- Touch drag-and-drop; touch users use the move buttons.

## Assumptions

- Hidden scenarios (spec 004) keep their place in the order.

## Verification

| REQ        | Test                                                                    | Result |
| ---------- | ----------------------------------------------------------------------- | ------ |
| REQ-005-01 | `REQ-005-01 moving a scenario shifts the others and keeps its color`    | pass   |
| REQ-005-01 | `REQ-005-01 dragging a tab onto another moves it there`                 | pass   |
| REQ-005-02 | `REQ-005-02 move buttons swap the selected scenario with its neighbour` | pass   |
| REQ-005-03 | `REQ-005-03 legend and results table follow the scenario order`         | pass   |
| REQ-005-03 | `REQ-005-03 the order survives a reload`                                | pass   |
