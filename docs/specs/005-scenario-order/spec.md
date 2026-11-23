# 005 – Scenario order

**Status:** Implemented

## Goal

Users comparing several scenarios want related ones next to each other, e.g. a variant right after
its original. Today scenarios stay in the order they were created. This spec lets users reorder
scenarios; the chart legend and the results table follow that order.

## Requirements

### REQ-005-01 Reordering by dragging

- **Given** several scenarios
- **When** the user drags a scenario's tab onto another scenario's tab, with a mouse or by touch
- **Then** the dragged scenario takes that scenario's position and the others shift
- **And** each scenario keeps its color, settings and visibility
- **And** while dragging, the tab follows the pointer and the other tabs make room for it

### REQ-005-02 Reordering without a mouse (deprecated)

> Deprecated by REQ-005-04: the move buttons are removed; drag and drop works with mouse, touch and keyboard.

- **Given** a selected scenario
- **When** the user presses "Move left" or "Move right"
- **Then** the selected scenario swaps places with its neighbour and stays selected
- **And** "Move left" is disabled for the first scenario, "Move right" for the last

### REQ-005-04 Reordering with the keyboard

- **Given** a focused scenario tab
- **When** the user presses Space on its drag handle, moves it with the arrow keys and presses Space again
- **Then** the scenario moves to that position
- **And** Escape cancels the move

### REQ-005-05 Dragging does not get in the way

- **Given** a scenario tab
- **When** the user clicks or taps it without moving the pointer, or scrolls the page by touch
- **Then** the scenario is selected (or the page scrolls) and nothing is moved

### REQ-005-03 Results follow the order

- **Given** reordered scenarios
- **When** the results are shown
- **Then** the chart legend and the results table list the scenarios in the order of the scenario bar
- **And** the order is kept across reloads

## Out of scope

- Sorting scenarios automatically (e.g. by median result).

## Assumptions

- Hidden scenarios (spec 004) keep their place in the order.

## Verification

| REQ        | Test                                                                                                      | Result |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------ |
| REQ-005-01 | `REQ-005-01 moving a scenario shifts the others and keeps its color`                                      | pass   |
| REQ-005-01 | e2e `REQ-005-01 scenarios can be reordered by mouse drag and the order survives a reload`                 | pass   |
| REQ-005-01 | e2e `mobile.spec.ts` › `REQ-005-01 / REQ-005-05 scenarios can be reordered by touch (press and hold)`     | pass   |
| REQ-005-02 | deprecated → REQ-005-04; `REQ-005-02 / REQ-005-04 there are no move buttons; each tab has a drag handle`  | pass   |
| REQ-005-03 | `REQ-005-03 legend and results table follow the scenario order`                                           | pass   |
| REQ-005-03 | e2e `REQ-005-01 … the order survives a reload`                                                            | pass   |
| REQ-005-04 | e2e `REQ-005-04 scenarios can be reordered with the keyboard` (incl. Escape cancels)                      | pass   |
| REQ-005-05 | `REQ-005-05 clicking a tab selects it and moves nothing`; e2e `REQ-005-05 a click selects without moving` | pass   |
