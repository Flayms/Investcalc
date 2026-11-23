import type { Messages } from "@/features/i18n/messages/en";
import type { Format } from "@/lib/format";
import type { SimulationError } from "@/simulation/simulate";

/** Why a simulation has no result, in the selected language (REQ-012-01). */
export function errorText(t: Messages, format: Format, error: SimulationError): string {
  switch (error.kind) {
    case "periodShorterThanHorizon":
      return t.errors.periodShorterThanHorizon(format.number(error.years, 1));
    case "periodShorterThanTwoYears":
      return t.errors.periodShorterThanTwoYears(format.number(error.years, 1));
    case "noPaths":
      return t.errors.noPaths;
  }
}
