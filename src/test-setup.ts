import "@testing-library/jest-dom/vitest";

// jsdom lacks ResizeObserver (used by Recharts' ResponsiveContainer and Radix).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
