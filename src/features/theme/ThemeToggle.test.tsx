import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

function mockSystemPrefersDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

test("REQ-003-03 the theme switch toggles dark mode and remembers it", () => {
  mockSystemPrefersDark(false);
  const { unmount } = render(<ThemeToggle />);
  expect(document.documentElement).not.toHaveClass("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
  expect(document.documentElement).toHaveClass("dark");
  unmount();

  // A reload restores the choice even though the system prefers light.
  document.documentElement.classList.remove("dark");
  render(<ThemeToggle />);
  expect(document.documentElement).toHaveClass("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
  expect(document.documentElement).not.toHaveClass("dark");
});

test("REQ-003-04 without a stored choice the theme follows the system preference", () => {
  mockSystemPrefersDark(true);
  const { unmount } = render(<ThemeToggle />);
  expect(document.documentElement).toHaveClass("dark");
  unmount();

  document.documentElement.classList.remove("dark");
  mockSystemPrefersDark(false);
  render(<ThemeToggle />);
  expect(document.documentElement).not.toHaveClass("dark");
});
