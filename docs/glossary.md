# Glossary

Domain terms used in code, specs and tests. Use these names consistently.

## Simulation

| Term                  | Definition                                                                                             | Not to be confused with |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| Simulation            | One run of N paths for a given strategy and parameters                                                 | Path                    |
| Path                  | A single simulated sequence of returns and the resulting portfolio value over the horizon              | Simulation              |
| Horizon               | Length of the simulated investment period                                                              |                         |
| Percentile band       | Range of portfolio values between two percentiles (e.g. P10–P90) across all paths at each step         | Confidence interval     |
| Seed                  | PRNG start value that makes a simulation reproducible                                                  |                         |
| Scenario              | One named combination of choices (index, amounts, mix, leverage, strategy, loan); several are compared | Strategy                |
| Shared settings       | Settings that are the same for all scenarios: data period, product/trading costs, German taxes         | Scenario                |
| Hidden scenario       | A scenario kept in the scenario bar but excluded from simulation, chart and results table              | Scenario                |
| Historical window     | A path that replays a contiguous real period of the history                                            | Random slicing          |
| Random slicing        | Path generation by stationary block bootstrap: random contiguous blocks of history stitched together   | Historical window       |
| Warm-up               | Months of history before the horizon, used only to compute SMA signals                                 | Horizon                 |
| Net worth             | Holdings + cash − loan − unpaid taxes at a point in time, before the final sale                        | Final value after tax   |
| Final value after tax | Net worth after selling everything at the end and paying all taxes                                     | Net worth               |
| Distribution          | Final value after tax at every percentile from P1 to P99, plotted against the percentile               | Percentile band         |
| Sweep                 | Simulations of one scenario for every value of one slider, all else unchanged, on the same paths       | Simulation              |
| Value explorer        | View of a sweep: distribution and trade-off diagrams, the best value for the chosen goal               | Factor impact           |
| Goal                  | What "best" means in the value explorer: highest median, best bad case (P10) or lowest chance of loss  | Strategy                |
| Chance of loss        | Share of paths whose final value after tax is below the amount paid in (P(loss))                       |                         |
| Yearly return (p.a.)  | Money-weighted yearly return that turns the amount paid in into a given final value                    | CAGR of the index       |

## Investing

| Term                    | Definition                                                                                                   | Not to be confused with         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| ETF                     | Exchange-traded fund; the simulated asset                                                                    | Index (what the ETF tracks)     |
| Strategy                | Rule set for when and how much to invest (and withdraw/rebalance)                                            | Portfolio                       |
| Lump sum                | Strategy investing the whole amount at the start                                                             | DCA                             |
| DCA                     | Dollar-cost averaging: investing a fixed amount at regular intervals                                         | Lump sum                        |
| TER                     | Total expense ratio: annual fund cost, deducted from returns                                                 |                                 |
| CAGR                    | Compound annual growth rate of a path                                                                        | Average annual return           |
| Max drawdown            | Largest peak-to-trough drop in portfolio value along a path                                                  |                                 |
| Leverage factor         | Daily-reset multiple L of the index return a leveraged ETF targets                                           | Effective leverage of a mix     |
| Volatility drag         | Loss of a daily-reset leveraged ETF in volatile markets, ≈ (L²−L)/2 × realised variance                      | TER                             |
| Realised variance       | Sum of a month's squared daily log returns; drives the volatility drag                                       | Volatility (of monthly returns) |
| US total market         | All listed US stocks, value weighted (CRSP via Kenneth French's data library), since 1926                    | S&P 500                         |
| SOFR                    | Secured Overnight Financing Rate; short rate leveraged ETFs pay on borrowed money (proxy: 3-month T-bill)    | Financing spread                |
| Financing spread        | Swap cost above SOFR on the borrowed part of a leveraged ETF                                                 | SOFR                            |
| SMA                     | Simple moving average of the index level over n months; SMA strategy is invested only above it               |                                 |
| Borrow from future self | Strategy: borrow the present value of future contributions, invest it now, repay with the contributions      | Lump sum                        |
| Market phase            | Bull (< 10 % below all-time high), correction (10–20 %), bear (≥ 20 %)                                       |                                 |
| Bear market             | Decline of ≥ 20 % from an all-time high; runs from that peak to the lowest point before the high is regained | Correction                      |
| Bull market             | Rise from a bear market's low to the next bear market's peak (the current one: to today)                     |                                 |
| Recovery                | Months from a bear market's peak until the all-time high is regained                                         | Peak to low                     |
| Time frame              | Trailing period of history shown in the market chart (1–50 years or the whole history)                       | Horizon                         |
| Short rate              | Latest 3-month T-bill rate, the SOFR proxy leveraged ETFs pay on borrowed money                              | Financing spread                |

## German taxes

| Term               | Definition                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Abgeltungsteuer    | 25 % flat tax on capital income; with Solidaritätszuschlag 26.375 %                                     |
| Teilfreistellung   | Partial exemption: 30 % of gains of equity funds are tax-free                                           |
| Sparerpauschbetrag | Yearly tax-free allowance for capital income (€1,000 single, €2,000 couples)                            |
| Vorabpauschale     | Yearly advance taxation of accumulating funds: start value × Basiszins × 0.7, capped at the year's gain |
| Basiszins          | Base rate for the Vorabpauschale, published yearly                                                      |
| Verlustvortrag     | Loss carry-forward: losses offset later gains                                                           |
