import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/i18n";
import { FieldControl } from "@/features/scenarios/FieldControl";
import { type SharedContext, sharedGroups } from "@/features/scenarios/fields";
import type { SharedSettings } from "@/features/scenarios/scenario";

type Props = {
  shared: SharedSettings;
  context: SharedContext;
  onChange: (shared: SharedSettings) => void;
};

/** Product costs, trading costs and taxes: the same for every scenario (REQ-002-02). */
export function SharedSettingsCard({ shared, context, onChange }: Props) {
  const { t } = useI18n();
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">{t.sharedSettings.title}</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {t.sharedSettings.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {sharedGroups.map((group) => {
          const fields = group.fields.filter((f) => !f.visible || f.visible(shared, context));
          if (fields.length === 0) return null;
          return (
            <section key={group.id} className="space-y-4">
              <h3 className="font-hand text-xl leading-none font-bold text-primary">
                {t.groups[group.id]}
              </h3>
              {fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={shared[field.key]}
                  onChange={(value) => onChange({ ...shared, [field.key]: value })}
                />
              ))}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
