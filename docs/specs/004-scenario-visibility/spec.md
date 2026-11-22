# 004 – Scenario visibility and body typeface

**Status:** Implemented

## Goal

Users who build up many scenarios to compare want to focus on a few of them without deleting the
others: the chart and the results table get crowded when every scenario is always shown. Users also
found the body typeface out of place on the notebook page. This spec lets users hide and show
scenarios and switches the body text to a friendlier, still highly legible typeface.

## Requirements

### REQ-004-01 Hiding a scenario

- **Given** several scenarios
- **When** the user switches a scenario's visibility toggle off
- **Then** the scenario no longer appears in the chart, its legend or the results table
- **And** it stays in the scenario bar, marked as hidden, and can still be selected and edited

### REQ-004-02 Showing a scenario again

- **Given** a hidden scenario
- **When** the user switches its visibility toggle on
- **Then** it appears in the chart, its legend and the results table again, with its color unchanged

### REQ-004-03 Visibility survives a reload

- **Given** the user has hidden some scenarios
- **When** the page is reloaded
- **Then** the same scenarios are hidden
- **And** state stored before this feature existed is restored with every scenario visible

### REQ-004-04 Body typeface

- **Given** either theme
- **When** the dashboard is shown
- **Then** body text, labels and numbers use a rounded, friendly typeface that matches the
  handwritten notebook look and stays highly legible (open letter shapes, aligned figures in tables)
- **And** handwriting is still used only for headings

## Out of scope

- Hiding all scenarios at once.
- Reordering scenarios (see spec 005).

## Assumptions

- Hidden scenarios are not simulated, so hiding them also makes the dashboard faster.
- At least one scenario may stay hidden or all may be hidden; the chart and table then show their empty state.

## Verification

| REQ        | Test                                                                    | Result            |
| ---------- | ----------------------------------------------------------------------- | ----------------- |
| REQ-004-01 | `REQ-004-01 hidden scenarios leave the chart and the results table`     | pass              |
| REQ-004-02 | `REQ-004-02 a hidden scenario can be shown again`                       | pass              |
| REQ-004-03 | `REQ-004-03 hidden scenarios stay hidden after a reload`                | pass              |
| REQ-004-03 | `REQ-004-03 state without visibility restores every scenario visible`   | pass              |
| REQ-004-04 | Manual: `docs/screenshots/home.png`, `home-dark.png`, `home-mobile.png` | pass (screenshot) |
