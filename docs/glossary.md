# Glossary

Domain terms used in code, specs and tests. Use these names consistently.

## Simulation

| Term            | Definition                                                                                     | Not to be confused with |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| Simulation      | One run of N paths for a given strategy and parameters                                         | Path                    |
| Path            | A single simulated sequence of returns and the resulting portfolio value over the horizon      | Simulation              |
| Horizon         | Length of the simulated investment period                                                      |                         |
| Percentile band | Range of portfolio values between two percentiles (e.g. P10–P90) across all paths at each step | Confidence interval     |
| Seed            | PRNG start value that makes a simulation reproducible                                          |                         |

## Investing

| Term         | Definition                                                           | Not to be confused with     |
| ------------ | -------------------------------------------------------------------- | --------------------------- |
| ETF          | Exchange-traded fund; the simulated asset                            | Index (what the ETF tracks) |
| Strategy     | Rule set for when and how much to invest (and withdraw/rebalance)    | Portfolio                   |
| Lump sum     | Strategy investing the whole amount at the start                     | DCA                         |
| DCA          | Dollar-cost averaging: investing a fixed amount at regular intervals | Lump sum                    |
| TER          | Total expense ratio: annual fund cost, deducted from returns         |                             |
| CAGR         | Compound annual growth rate of a path                                | Average annual return       |
| Max drawdown | Largest peak-to-trough drop in portfolio value along a path          |                             |
