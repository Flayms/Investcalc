# 008 – Value explorer: Plan

## Approach

- Engine: `simulation/sweep.ts` sweeps one slider over fixed values spanning its range on one set of
  paths (common random numbers, up to 500 paths), returning percentiles P5–P95 and the chance of
  loss per value. `bestPoint` picks the best value for a goal with ties by median. The old
  `exploreLeverage` (always 100 % leveraged) is removed.
- Worker protocol: one `sweep` request per slider and a separate `factors` request, so each card
  fills in as soon as its own result is ready instead of waiting for one big analysis.
- UI: `features/explorer`. The slider metadata (label, range) comes from `fields.ts`, so the
  explorer tabs, the axis domain and the small curve under the slider always match the slider.
  The goal and the active explorer tab live in `App`, shared by the explorer and the curves.
- Trade-off: extra sweeps cost ~0.1 s per value; mitigated by the request queue of spec 009.

## Tasks

- [x] `sweepParameter`, `SWEEP_VALUES`, assumptions and SMA reference (REQ-008-01, REQ-008-02)
- [x] `bestPoint` with goals median / bad case / chance of loss (REQ-008-03)
- [x] Worker `sweep` / `factors` requests and hook state per sweep (REQ-008-01)
- [x] Value explorer card: slider tabs, goal switch, distribution and trade-off diagrams, takeaway, "Use" (REQ-008-03, REQ-008-04)
- [x] Goal curve under each explored slider with "Use" and "Explore" (REQ-008-05)
- [x] Deprecate REQ-001-16 and REQ-002-04; docs and screenshots
