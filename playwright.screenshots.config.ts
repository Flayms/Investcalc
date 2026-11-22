import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// `bun run screenshots` — writes docs/screenshots/*.png for the README and PRs.
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: "**/screenshots.spec.ts",
});
