import { useI18n } from "@/features/i18n/i18n";
import { LANGUAGES, type Language } from "@/features/i18n/language";
import { cn } from "@/lib/utils";

/** Each language's name in its own language, so it can be found whatever is selected. */
const NAMES: Record<Language, string> = { en: "English", de: "Deutsch" };

/** Header switch between English and German (REQ-014-01). */
export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring a legend and border we do not want here.
    <div role="group" aria-label={t.language.label} className="inline-flex rounded-lg bg-muted p-1">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-label={NAMES[l]}
          title={NAMES[l]}
          aria-pressed={language === l}
          onClick={() => setLanguage(l)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
            language === l
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
