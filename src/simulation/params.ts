import { z } from "zod";
import { datasetIds } from "@/simulation/dataset";

/** Everything the user can set per scenario. Rates are fractions (0.01 = 1 %). */
export const scenarioSchema = z.object({
  name: z.string().min(1),
  etfId: z.enum(datasetIds).or(z.string()),
  fromYear: z.number().int(),
  toYear: z.number().int(),
  /** Currency the investor holds and is taxed in (REQ-011-01). */
  currency: z.enum(["EUR", "USD"]),
  /** Results in purchasing power at the start instead of nominal amounts (REQ-013-01). */
  inflationAdjusted: z.boolean(),

  monthlyContribution: z.number().min(0),
  initialInvestment: z.number().min(0),

  leverage: z.number().min(1).max(3),
  leveragedShare: z.number().min(0).max(1),
  terUnleveraged: z.number().min(0),
  terLeveraged: z.number().min(0),
  includeSofr: z.boolean(),
  financingSpread: z.number().min(0),

  bidAskSpread: z.number().min(0),
  orderFee: z.number().min(0),

  taxesEnabled: z.boolean(),
  taxRate: z.number().min(0).max(1),
  partialExemption: z.boolean(),
  allowance: z.number().min(0),
  baseRate: z.number().min(0),

  strategy: z.enum(["buyAndHold", "sma"]),
  smaMonths: z.number().int().min(2).max(12),

  borrowFromFuture: z.boolean(),
  loanMonths: z.number().int().min(1),
  loanRate: z.number().min(0),
});

export type ScenarioParams = z.infer<typeof scenarioSchema>;

/** Settings shared by all scenarios so that they are compared on the same paths. */
export const globalSchema = z.object({
  horizonYears: z.number().int().min(1).max(50),
  paths: z.number().int().min(100).max(20_000),
  sampling: z.enum(["rolling", "bootstrap"]),
  blockMonths: z.number().int().min(1).max(120),
  seed: z.number().int(),
});

export type GlobalSettings = z.infer<typeof globalSchema>;

export const PARTIAL_EXEMPTION_EQUITY = 0.3;
/** Months of history before the horizon used to warm up SMA signals. */
export const WARMUP_MONTHS = 12;

export const defaultScenario: ScenarioParams = {
  name: "Savings plan 1×",
  etfId: "sp500",
  fromYear: 1871,
  toYear: 2100,
  currency: "EUR",
  inflationAdjusted: true,
  monthlyContribution: 500,
  initialInvestment: 0,
  leverage: 2,
  leveragedShare: 0,
  terUnleveraged: 0.002,
  terLeveraged: 0.006,
  includeSofr: true,
  financingSpread: 0.005,
  bidAskSpread: 0.001,
  orderFee: 1,
  taxesEnabled: true,
  taxRate: 0.26375,
  partialExemption: true,
  allowance: 1000,
  baseRate: 0.025,
  strategy: "buyAndHold",
  smaMonths: 10,
  borrowFromFuture: false,
  loanMonths: 60,
  loanRate: 0.06,
};

export const defaultGlobal: GlobalSettings = {
  horizonYears: 20,
  paths: 2000,
  sampling: "bootstrap",
  blockMonths: 24,
  seed: 42,
};
