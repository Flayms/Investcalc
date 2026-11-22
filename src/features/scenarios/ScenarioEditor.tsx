import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FieldControl, HelpTooltip } from "@/features/scenarios/FieldControl";
import { scenarioGroups } from "@/features/scenarios/fields";
import { type Scenario, scenarioColor } from "@/features/scenarios/scenario";
import { type Dataset, firstYear, getDataset, lastYear } from "@/simulation/dataset";
import type { ScenarioParams } from "@/simulation/params";

type Props = {
  scenario: Scenario;
  datasets: Record<string, Dataset>;
  onChange: (params: ScenarioParams) => void;
};

export function ScenarioEditor({ scenario, datasets, onChange }: Props) {
  const p = scenario.params;
  const set = (patch: Partial<ScenarioParams>) => onChange({ ...p, ...patch });
  const dataset = getDataset(datasets, p.etfId);
  const min = firstYear(dataset);
  const max = lastYear(dataset);
  const from = Math.max(min, Math.min(p.fromYear, max));
  const to = Math.min(max, Math.max(p.toYear, from));

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
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="scenario-name" className="text-xs font-medium">
            Name
          </Label>
          <Input
            id="scenario-name"
            className="h-8 text-sm"
            value={p.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ETF & data
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="etf" className="text-xs font-medium">
                Index
              </Label>
              <HelpTooltip
                label="Index"
                help="MSCI World: developed markets only (~23 countries, ~70 % USA). MSCI ACWI (≈ FTSE All-World): World + emerging markets. S&P 500: 500 large US companies."
                recommendation="S&P 500 for the longest history (since 1871, many crashes); MSCI data only starts in 2001."
              />
            </div>
            <Select
              value={p.etfId}
              onValueChange={(etfId) => {
                const d = getDataset(datasets, etfId);
                set({ etfId, fromYear: firstYear(d), toYear: lastYear(d) });
              }}
            >
              <SelectTrigger id="etf" className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(datasets).map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-medium">Historical period</Label>
              <HelpTooltip
                label="Historical period"
                help="Only months inside this period are used to generate paths."
                recommendation="The full period: more market regimes make the distribution more robust."
              />
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {from}–{to}
              </span>
            </div>
            <Slider
              aria-label="Historical period"
              min={min}
              max={max}
              step={1}
              minStepsBetweenThumbs={1}
              value={[from, to]}
              onValueChange={([fromYear, toYear]) => set({ fromYear, toYear })}
            />
          </div>
        </section>

        {scenarioGroups.map((group) => {
          const fields = group.fields.filter((f) => !f.visible || f.visible(p));
          return (
            <section key={group.title} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              {fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={p[field.key]}
                  onChange={(value) => set({ [field.key]: value } as Partial<ScenarioParams>)}
                />
              ))}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
