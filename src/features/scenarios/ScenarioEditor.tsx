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
import { dataText } from "@/features/i18n/datasets";
import { useI18n } from "@/features/i18n/i18n";
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
  const { t } = useI18n();

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="size-3 rounded-full"
            style={{ background: scenarioColor(scenario) }}
            aria-hidden
          />
          {t.scenarioEditor.title}
        </CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {t.scenarioEditor.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="scenario-name" className="text-sm lg:text-xs font-medium">
            {t.scenarioEditor.name}
          </Label>
          <Input
            id="scenario-name"
            className="h-10 lg:h-8 text-sm"
            value={p.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <section className="space-y-4">
          <h3 className="font-hand text-xl leading-none font-bold text-primary">
            {t.scenarioEditor.index}
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="etf" className="text-sm lg:text-xs font-medium">
                {t.scenarioEditor.index}
              </Label>
              <HelpTooltip
                label={t.scenarioEditor.index}
                help={t.scenarioEditor.indexHelp}
                recommendation={t.scenarioEditor.indexRecommendation}
              />
            </div>
            <Select value={p.etfId} onValueChange={(etfId) => set({ etfId })}>
              <SelectTrigger id="etf" className="h-10 lg:h-8 w-full text-sm lg:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(datasets).map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-sm lg:text-xs">
                    {dataText(t, d).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {scenarioGroups.map((group) => {
          const fields = group.fields.filter((f) => !f.visible || f.visible(p));
          return (
            <section key={group.id} className="space-y-4">
              <h3 className="font-hand text-xl leading-none font-bold text-primary">
                {t.groups[group.id]}
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
