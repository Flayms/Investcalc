import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldControl, HelpTooltip } from "@/features/scenarios/FieldControl";
import { globalFields } from "@/features/scenarios/fields";
import type { GlobalSettings } from "@/simulation/params";

type Props = {
  global: GlobalSettings;
  onChange: (g: GlobalSettings) => void;
  /** Further shared simulation settings, shown below the built-in ones. */
  children?: ReactNode;
};

export function GlobalSettingsCard({ global, onChange, children }: Props) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Simulation</CardTitle>
        <CardDescription className="text-xs">Shared by all scenarios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {globalFields
          .filter((f) => !f.visible || f.visible(global))
          .map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={global[field.key]}
              onChange={(value) => onChange({ ...global, [field.key]: value })}
            />
          ))}
        {global.sampling === "bootstrap" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="seed" className="text-xs font-medium">
              Seed
            </Label>
            <HelpTooltip
              label="Seed"
              help="Start value of the random generator. Same seed = same paths = reproducible results."
            />
            <Input
              id="seed"
              type="number"
              className="ml-auto h-8 w-24 text-right text-xs"
              value={global.seed}
              onChange={(e) =>
                onChange({ ...global, seed: Math.trunc(Number(e.target.value) || 0) })
              }
            />
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
