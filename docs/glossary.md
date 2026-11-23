# Glossary

Domain terms used in code, specs and tests. Use these names consistently; the German column is the term in the German UI (`src/features/i18n/messages/de.ts`). German tax terms are the same in both languages.

## Simulation

| Term                  | German                                  | Definition                                                                                               | Not to be confused with |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------- |
| Simulation            | Simulation                              | One run of N paths for a given strategy and parameters                                                   | Path                    |
| Path                  | Pfad                                    | A single simulated sequence of returns and the resulting portfolio value over the horizon                | Simulation              |
| Horizon               | Anlagedauer                             | Length of the simulated investment period                                                                |                         |
| Percentile band       | Perzentilband                           | Range of portfolio values between two percentiles (e.g. P10–P90) across all paths at each step           | Confidence interval     |
| Seed                  | Seed                                    | PRNG start value that makes a simulation reproducible                                                    |                         |
| Scenario              | Szenario                                | One named combination of choices (index, amounts, mix, leverage, strategy, loan); several are compared   | Strategy                |
| Shared settings       | Gemeinsame Einstellungen                | Settings that are the same for all scenarios: data period, currency, product/trading costs, German taxes | Scenario                |
| Hidden scenario       | Ausgeblendetes Szenario                 | A scenario kept in the scenario bar but excluded from simulation, chart and results table                | Scenario                |
| Historical window     | Historisches Zeitfenster                | A path that replays a contiguous real period of the history                                              | Random slicing          |
| Random slicing        | Zufällige Ausschnitte (Block-Bootstrap) | Path generation by stationary block bootstrap: random contiguous blocks of history stitched together     | Historical window       |
| Warm-up               | Vorlauf                                 | Months of history before the horizon, used only to compute SMA signals                                   | Horizon                 |
| Net worth             | Vermögen                                | Holdings + cash − loan − unpaid taxes at a point in time, before the final sale                          | Final value after tax   |
| Final value after tax | Endwert nach Steuern                    | Net worth after selling everything at the end and paying all taxes                                       | Net worth               |
| Distribution          | Verteilung                              | Final value after tax at every percentile from P1 to P99, plotted against the percentile                 | Percentile band         |
| Sweep                 | Durchlauf                               | Simulations of one scenario for every value of one slider, all else unchanged, on the same paths         | Simulation              |
| Value explorer        | Werte-Explorer                          | View of a sweep: distribution and trade-off diagrams, the best value for the chosen goal                 | Factor impact           |
| Goal                  | Ziel (Optimieren für)                   | What "best" means in the value explorer: highest median, best bad case (P10) or lowest chance of loss    | Strategy                |
| Chance of loss        | Verlustwahrscheinlichkeit               | Share of paths whose final value after tax is below the amount paid in (P(loss))                         |                         |
| Yearly return (p.a.)  | Jahresrendite (p. a.)                   | Money-weighted yearly return that turns the amount paid in into a given final value                      | CAGR of the index       |

## Investing

| Term                    | German                             | Definition                                                                                                   | Not to be confused with         |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| ETF                     | ETF                                | Exchange-traded fund; the simulated asset                                                                    | Index (what the ETF tracks)     |
| Strategy                | Strategie                          | Rule set for when and how much to invest (and withdraw/rebalance)                                            | Portfolio                       |
| Lump sum                | Einmalanlage                       | Strategy investing the whole amount at the start                                                             | DCA                             |
| DCA                     | Sparplan (Cost-Average)            | Dollar-cost averaging: investing a fixed amount at regular intervals                                         | Lump sum                        |
| TER                     | TER (Gesamtkostenquote)            | Total expense ratio: annual fund cost, deducted from returns                                                 |                                 |
| CAGR                    | CAGR                               | Compound annual growth rate of a path                                                                        | Average annual return           |
| Max drawdown            | Max. Drawdown                      | Largest peak-to-trough drop in portfolio value along a path                                                  |                                 |
| Leverage factor         | Hebelfaktor                        | Daily-reset multiple L of the index return a leveraged ETF targets                                           | Effective leverage of a mix     |
| Volatility drag         | Volatilitätsverlust                | Loss of a daily-reset leveraged ETF in volatile markets, ≈ (L²−L)/2 × realised variance                      | TER                             |
| Realised variance       | Realisierte Varianz                | Sum of a month's squared daily log returns; drives the volatility drag                                       | Volatility (of monthly returns) |
| Inflation-adjusted      | Inflationsbereinigt                | Amount expressed in purchasing power at the start of the investment (divided by the price rise since then)   | Nominal                         |
| Gross / net return      | Brutto- / Nettorendite             | Total return with dividends before / after withholding tax; ETFs earn roughly the net return                 | Price return                    |
| Currency effect         | Währungseffekt                     | Change of the dollar's value in euros in a month; applied once to every fund in euro simulations             | Volatility drag                 |
| Euro short rate         | Euro-Kurzfristzins (Geldmarktzins) | German 3-month money market rate (euro area after 1999); earned on cash in euro simulations                  | Short rate                      |
| US total market         | US-Gesamtmarkt                     | All listed US stocks, value weighted (CRSP via Kenneth French's data library), since 1926                    | S&P 500                         |
| SOFR                    | SOFR                               | Secured Overnight Financing Rate; short rate leveraged ETFs pay on borrowed money (proxy: 3-month T-bill)    | Financing spread                |
| Financing spread        | Finanzierungsaufschlag             | Swap cost above SOFR on the borrowed part of a leveraged ETF                                                 | SOFR                            |
| SMA                     | SMA (gleitender Durchschnitt)      | Simple moving average of the index level over n months; SMA strategy is invested only above it               |                                 |
| Borrow from future self | Kredit bei deinem zukünftigen Ich  | Strategy: borrow the present value of future contributions, invest it now, repay with the contributions      | Lump sum                        |
| Market phase            | Marktphase                         | Bull (< 10 % below all-time high), correction (10–20 %), bear (≥ 20 %)                                       |                                 |
| Bear market             | Bärenmarkt                         | Decline of ≥ 20 % from an all-time high; runs from that peak to the lowest point before the high is regained | Correction                      |
| Bull market             | Bullenmarkt                        | Rise from a bear market's low to the next bear market's peak (the current one: to today)                     |                                 |
| Recovery                | Erholung                           | Months from a bear market's peak until the all-time high is regained                                         | Peak to low                     |
| Time frame              | Zeitraum                           | Trailing period of history shown in the market chart (1–50 years or the whole history)                       | Horizon                         |
| Short rate              | Kurzfristzins                      | Latest 3-month T-bill rate, the SOFR proxy leveraged ETFs pay on borrowed money                              | Financing spread                |

## German taxes

| Term               | Definition                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Abgeltungsteuer    | 25 % flat tax on capital income; with Solidaritätszuschlag 26.375 %                                     |
| Teilfreistellung   | Partial exemption: 30 % of gains of equity funds are tax-free                                           |
| Sparerpauschbetrag | Yearly tax-free allowance for capital income (€1,000 single, €2,000 couples)                            |
| Vorabpauschale     | Yearly advance taxation of accumulating funds: start value × Basiszins × 0.7, capped at the year's gain |
| Basiszins          | Base rate for the Vorabpauschale, published yearly                                                      |
| Verlustvortrag     | Loss carry-forward: losses offset later gains                                                           |
