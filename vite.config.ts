/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base: works on GitHub Pages (/<repo>/) and locally without configuration.
  base: "./",
  worker: { format: "es" },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    globals: true,
    environment: "jsdom",
    // forks pool crashes when Vitest runs under the Bun runtime (see docs/known-pitfalls.md)
    pool: "threads",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
