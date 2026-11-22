import { createRng } from "@/simulation/rng";
import { blockBootstrapPath, rollingWindowPaths } from "@/simulation/sampling";

describe("REQ-001-03 rolling historical windows", () => {
  test("REQ-001-03 one contiguous path per possible start month", () => {
    const paths = rollingWindowPaths(10, 4);
    expect(paths).toHaveLength(7);
    expect(paths[0]).toEqual([0, 1, 2, 3]);
    expect(paths[6]).toEqual([6, 7, 8, 9]);
  });

  test("REQ-001-03 no paths when the history is shorter than the path", () => {
    expect(rollingWindowPaths(3, 4)).toEqual([]);
  });
});

describe("REQ-001-04 random slicing (block bootstrap)", () => {
  test("REQ-001-04 same seed → same path, different seed → different path", () => {
    const a = blockBootstrapPath(500, 120, 24, createRng(1));
    const b = blockBootstrapPath(500, 120, 24, createRng(1));
    const c = blockBootstrapPath(500, 120, 24, createRng(2));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a).toHaveLength(120);
  });

  test("REQ-001-04 paths consist of contiguous blocks with the requested mean length", () => {
    const rng = createRng(7);
    let breaks = 0;
    let steps = 0;
    for (let p = 0; p < 200; p++) {
      const path = blockBootstrapPath(1000, 240, 24, rng);
      for (let i = 1; i < path.length; i++) {
        steps++;
        if (path[i] !== ((path[i - 1] ?? 0) + 1) % 1000) breaks++;
        expect(path[i]).toBeGreaterThanOrEqual(0);
        expect(path[i]).toBeLessThan(1000);
      }
    }
    expect(steps / breaks).toBeGreaterThan(20);
    expect(steps / breaks).toBeLessThan(28);
  });
});
