import type { Language } from "@/lib/format";

export type { Language } from "@/lib/format";
export const LANGUAGES: readonly Language[] = ["en", "de"];

/** Also read by the inline script in index.html that sets `<html lang>` before first paint. */
export const LANGUAGE_KEY = "investcalc:language";

function storedLanguage(): Language | undefined {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    return value === "en" || value === "de" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** German for a German first preferred browser language (de, de-AT, …), else English (REQ-014-03). */
export function detectLanguage(preferred: readonly string[]): Language {
  return preferred[0]?.toLowerCase().split("-")[0] === "de" ? "de" : "en";
}

const browserLanguages = (): readonly string[] =>
  navigator.languages?.length ? navigator.languages : [navigator.language];

/** The stored choice (REQ-014-02), else the browser language (REQ-014-03). */
export function initialLanguage(preferred: readonly string[] = browserLanguages()): Language {
  return storedLanguage() ?? detectLanguage(preferred);
}

/** Screen readers and hyphenation follow `<html lang>` (REQ-014-05). */
export function applyLanguage(language: Language) {
  document.documentElement.lang = language;
}

export function storeLanguage(language: Language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Storage unavailable (private mode): the choice just isn't remembered.
  }
}
