import type { Rng } from "@/simulation/rng";

/** Every contiguous window of `pathLength` months in a history of `historyLength` months. */
export function rollingWindowPaths(historyLength: number, pathLength: number): number[][] {
  const paths: number[][] = [];
  for (let start = 0; start + pathLength <= historyLength; start++) {
    paths.push(Array.from({ length: pathLength }, (_, i) => start + i));
  }
  return paths;
}

/**
 * Stationary block bootstrap (Politis & Romano 1994): a path is stitched together from contiguous
 * blocks of history with geometrically distributed length (mean `meanBlock`). The history is treated
 * as circular so that every month is equally likely to be drawn.
 *
 * Why blocks and not single months: volatility clusters, crashes span several months and returns are
 * linked to interest rates. Drawing single months would destroy all of that and understate the risk
 * of leveraged and trend-following strategies.
 */
export function blockBootstrapPath(
  historyLength: number,
  pathLength: number,
  meanBlock: number,
  rng: Rng,
): number[] {
  const restart = 1 / Math.max(1, meanBlock);
  const path = new Array<number>(pathLength);
  let index = Math.floor(rng() * historyLength);
  for (let i = 0; i < pathLength; i++) {
    if (i > 0) {
      index = rng() < restart ? Math.floor(rng() * historyLength) : (index + 1) % historyLength;
    }
    path[i] = index;
  }
  return path;
}
