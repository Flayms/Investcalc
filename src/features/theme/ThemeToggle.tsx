import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";
import { applyTheme, initialTheme, storeTheme, type Theme } from "@/features/theme/theme";

/** Header button switching between the light and the dark theme (REQ-003-03). */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => applyTheme(theme), [theme]);
  const { t } = useI18n();

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? t.theme.switchToDark : t.theme.switchToLight;
  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next);
        storeTheme(next);
      }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
