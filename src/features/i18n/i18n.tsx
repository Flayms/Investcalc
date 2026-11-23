import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  applyLanguage,
  initialLanguage,
  type Language,
  storeLanguage,
} from "@/features/i18n/language";
import { de } from "@/features/i18n/messages/de";
import { en, type Messages } from "@/features/i18n/messages/en";
import { createFormat, type Format } from "@/lib/format";

export const MESSAGES: Record<Language, Messages> = { en, de };

export type I18n = {
  language: Language;
  /** Switches the UI text and number formats and remembers the choice (REQ-014-01, -02). */
  setLanguage: (language: Language) => void;
  t: Messages;
  format: Format;
};

const english: I18n = { language: "en", setLanguage: () => {}, t: en, format: createFormat("en") };

/** English without a provider, so components can be rendered on their own in tests. */
const I18nContext = createContext<I18n>(english);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  useEffect(() => applyLanguage(language), [language]);
  const value = useMemo<I18n>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        storeLanguage(next);
      },
      t: MESSAGES[language],
      format: createFormat(language),
    }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
