import {
  applyLanguage,
  detectLanguage,
  initialLanguage,
  LANGUAGE_KEY,
  storeLanguage,
} from "@/features/i18n/language";

beforeEach(() => localStorage.clear());

test("REQ-014-03 German browser languages open in German, all others in English", () => {
  expect(detectLanguage(["de"])).toBe("de");
  expect(detectLanguage(["de-AT", "en"])).toBe("de");
  expect(detectLanguage(["DE-ch"])).toBe("de");
  expect(detectLanguage(["en-US", "de"])).toBe("en");
  expect(detectLanguage(["fr-FR"])).toBe("en");
  expect(detectLanguage([])).toBe("en");
});

test("REQ-014-02 a stored choice wins over the browser language", () => {
  expect(initialLanguage(["de-DE"])).toBe("de");
  storeLanguage("en");
  expect(initialLanguage(["de-DE"])).toBe("en");
  storeLanguage("de");
  expect(initialLanguage(["en-US"])).toBe("de");
});

test("REQ-014-02 an invalid stored value is ignored", () => {
  localStorage.setItem(LANGUAGE_KEY, "fr");
  expect(initialLanguage(["en-US"])).toBe("en");
});

test("REQ-014-05 the document language follows the selected language", () => {
  applyLanguage("de");
  expect(document.documentElement.lang).toBe("de");
  applyLanguage("en");
  expect(document.documentElement.lang).toBe("en");
});
