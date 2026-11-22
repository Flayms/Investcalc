export type Theme = "light" | "dark";

/** Also read by the inline script in index.html that applies the theme before first paint. */
export const THEME_KEY = "investcalc:theme";

function storedTheme(): Theme | undefined {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** The stored choice, else the system preference (REQ-003-04). */
export function initialTheme(): Theme {
  return (
    storedTheme() ??
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice just isn't remembered.
  }
}
