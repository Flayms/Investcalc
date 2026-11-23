import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldControl, HelpTooltip } from "@/features/scenarios/FieldControl";
import { scenarioGroups } from "@/features/scenarios/fields";
import { type Scenario, type ScenarioChoices, scenarioColor } from "@/features/scenarios/scenario";
import type { Dataset } from "@/simulation/dataset";

type Props = {
  scenario: Scenario;
  datasets: Record<string, Dataset>;
  onChange: (params: ScenarioChoices) => void;
  /** Extra content under a slider, keyed by setting (REQ-008-05). */
  sliderFooter?: (key: keyof ScenarioChoices) => ReactNode;
};

export function ScenarioEditor({ scenario, datasets, onChange, sliderFooter }: Props) {
  const p = scenario.params;
  const set = (patch: Partial<ScenarioChoices>) => onChange({ ...p, ...patch });

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="size-3 rounded-full"
            style={{ background: scenarioColor(scenario) }}
            aria-hidden
          />
          Scenario settings
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          What you choose per scenario. Costs, taxes and the data period are shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="scenario-name" className="text-sm lg:text-xs font-medium">
            Name
          </Label>
          <Input
            id="scenario-name"
            className="h-10 lg:h-8 text-sm"
            value={p.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <section className="space-y-4">
          <h3 className="font-hand text-xl leading-none font-bold text-primary">Index</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="etf" className="text-sm lg:text-xs font-medium">
                Index
              </Label>
              <HelpTooltip
                label="Index"
                help="MSCI World: developed markets only (~23 countries, ~70 % USA). MSCI ACWI (≈ FTSE All-World): World + emerging markets. S&P 500: 500 large US companies."
                recommendation="S&P 500 for the longest history (since 1871, many crashes); MSCI data only starts in 2001."
              />
            </div>
            <Select value={p.etfId} onValueChange={(etfId) => set({ etfId })}>
              <SelectTrigger id="etf" className="h-10 lg:h-8 w-full text-sm lg:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(datasets).map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-sm lg:text-xs">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {scenarioGroups.map((group) => {
          const fields = group.fields.filter((f) => !f.visible || f.visible(p));
          return (
            <section key={group.title} className="space-y-4">
              <h3 className="font-hand text-xl leading-none font-bold text-primary">
                {group.title}
              </h3>
              {fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={p[field.key]}
                  onChange={(value) => set({ [field.key]: value } as Partial<ScenarioChoices>)}
                  footer={sliderFooter?.(field.key)}
                />
              ))}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
