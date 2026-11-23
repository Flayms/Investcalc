# Specs

One folder per feature: `docs/specs/NNN-name/` with `spec.md` and, for tier 3 work, `plan.md`.

## Index

| Spec                                                                 | Area                                                       | Status      |
| -------------------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| [001-monte-carlo-dashboard](001-monte-carlo-dashboard/spec.md)       | Simulation, UI, deployment                                 | Implemented |
| [002-dashboard-usability](002-dashboard-usability/spec.md)           | UI: persistence, shared settings, results readability      | Implemented |
| [003-notebook-look](003-notebook-look/spec.md)                       | UI: exact value input, dark theme, notebook styling        | Implemented |
| [004-scenario-visibility](004-scenario-visibility/spec.md)           | UI: hide/show scenarios, body typeface                     | Implemented |
| [005-scenario-order](005-scenario-order/spec.md)                     | UI: reorder scenarios                                      | Implemented |
| [006-market-history](006-market-history/spec.md)                     | Market: time frame, bear/bull markets, indicators          | Implemented |
| [007-final-value-distribution](007-final-value-distribution/spec.md) | UI: final value vs. percentile chart, % p.a. unit          | Implemented |
| [008-value-explorer](008-value-explorer/spec.md)                     | Best value of leverage, share and SMA sliders              | Implemented |
| [009-simulation-feedback](009-simulation-feedback/spec.md)           | UI: visible progress, stale results, skipped work          | Implemented |
| [010-daily-volatility](010-daily-volatility/spec.md)                 | Data: daily variance for the drag, US market since 1926    | Implemented |
| [011-eur-returns](011-eur-returns/spec.md)                           | Data: simulation in euros (exchange rate, euro short rate) | Implemented |
| [012-msci-history](012-msci-history/spec.md)                         | Data: MSCI World from 1970, ACWI from 1988                 | Implemented |
| [013-inflation](013-inflation/spec.md)                               | Results in purchasing power (inflation-adjusted)           | Implemented |
| [014-ui-language](014-ui-language/spec.md)                           | UI: English / German, localised numbers                    | Implemented |

## Conventions

- **Status:** `Draft` → `Approved` → `Implemented` (or `Deprecated`).
- **Requirement IDs:** `REQ-NNN-XX` (`NNN` = spec number, `XX` = running number).
- **IDs are never reused:** deprecate a requirement instead of deleting it.
- **Tests reference the REQ IDs** at the start of their title.
- **Spec and code change together:** A wrong or missing spec is a spec change, not a bug.
- **No implementation details** in `spec.md`.

## Template: `spec.md`

```markdown
# NNN – <Name>

**Status:** Draft

## Goal

One paragraph: who benefits and why.

## Requirements

### REQ-NNN-01 <title>

- **Given** …
- **When** …
- **Then** …
  (- **And** …)

## Out of scope

## Assumptions

## Verification

| REQ        | Test          | Result |
| ---------- | ------------- | ------ |
| REQ-NNN-01 | `<test name>` | pass   |
```

## Template: `plan.md`

```markdown
# NNN – <Name>: Plan

## Approach

<How it will be built, key trade-offs.>

## Tasks

- [ ] <task> (REQ-NNN-01)
```
