# 003 – Exact input, dark theme and notebook look

**Status:** Implemented

## Goal

Users who know the exact numbers they want (a monthly rate of €437, a TER of 0.07 %) can only
approximate them with sliders, which is slow and often impossible on the slider's step grid. Users
working at night want a dark theme. And the dashboard should feel like a personal back-of-the-
envelope calculation: a scribbled notebook page instead of a generic admin dashboard. This spec
lets users type exact values, adds a light/dark theme switch and restyles the page as a notebook.

## Requirements

### REQ-003-01 Typing an exact value

- **Given** a numeric setting shown as a slider
- **When** the user types a number into the setting's value box (in the unit shown, e.g. percent
  as `0.07` for 0.07 %) and presses Enter or leaves the box
- **Then** the setting takes exactly that value, even if it is not on the slider's step grid
- **And** the slider moves to that value

### REQ-003-02 Out-of-range and invalid input

- **Given** a numeric setting's value box
- **When** the user enters a number outside the setting's range
- **Then** the value is clamped to the nearest bound
- **And** when the user enters something that is not a number, or presses Escape, the box shows
  the previous value again and the setting is unchanged
- **And** settings counted in whole units (months, years, counts) are rounded to whole numbers

### REQ-003-03 Theme switch

- **Given** the dashboard
- **When** the user clicks the theme switch in the header
- **Then** the page switches between the light and the dark theme
- **And** the choice is kept across reloads

### REQ-003-04 Default theme follows the system

- **Given** the user has never used the theme switch
- **When** the page loads
- **Then** it shows the dark theme if the operating system prefers dark, otherwise the light theme

### REQ-003-05 Notebook look

- **Given** either theme
- **When** the dashboard is shown
- **Then** it looks like a page of a ruled notebook: ruled paper with a margin line, handwritten
  headings, hand-drawn (slightly irregular) outlines on cards and controls, and highlighter accents
- **And** body text, labels and numbers use a plain, highly legible typeface (handwriting only for headings; see REQ-004-04)
- **And** numbers and charts stay legible and charts keep their validated colors for the theme
  (stepped for the dark surface in the dark theme)

## Out of scope

- More than two themes, per-component themes.
- Locale-specific number entry (decimal comma is accepted, thousands separators are not).

## Assumptions

- Values typed into the box are in the unit the box shows (percent, euro, factor, months, years, count).

## Verification

| REQ        | Test                                                                                  | Result            |
| ---------- | ------------------------------------------------------------------------------------- | ----------------- |
| REQ-003-01 | `REQ-003-01 typing a value off the step grid sets exactly that value`                 | pass              |
| REQ-003-01 | `REQ-003-01 percent values are entered in percent`                                    | pass              |
| REQ-003-02 | `REQ-003-02 values outside the range are clamped`                                     | pass              |
| REQ-003-02 | `REQ-003-02 invalid input and Escape restore the previous value`                      | pass              |
| REQ-003-02 | `REQ-003-02 whole-unit settings are rounded`                                          | pass              |
| REQ-003-03 | `REQ-003-03 the theme switch toggles dark mode and remembers it`                      | pass              |
| REQ-003-04 | `REQ-003-04 without a stored choice the theme follows the system preference`          | pass              |
| REQ-003-05 | Manual: `docs/screenshots/home.png`, `home-dark.png`, `home-mobile.png`, `market.png` | pass (screenshot) |
