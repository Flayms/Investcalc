import { useState } from "react";
import { MarketCyclesCard } from "@/features/market/MarketCyclesCard";
import { MarketStatusCard } from "@/features/market/MarketStatusCard";
import { type Dataset, getDataset } from "@/simulation/dataset";
import { timeFrames } from "@/simulation/market";

/** The selected index and chart time frame, shared by the market cards. */
export function MarketView({ datasets }: { datasets: Record<string, Dataset> }) {
  const [id, setId] = useState("sp500");
  const [frameLabel, setFrameLabel] = useState("5Y");
  const dataset = getDataset(datasets, id);
  const frames = timeFrames(dataset);
  // Fall back to the whole history if the index is shorter than the chosen time frame.
  const frame =
    frames.find((f) => f.label === frameLabel && f.available) ??
    (frames.find((f) => f.label === "Max") as (typeof frames)[number]);

  return (
    <>
      <MarketStatusCard
        datasets={datasets}
        dataset={dataset}
        onDatasetChange={setId}
        frames={frames}
        frame={frame}
        onFrameChange={setFrameLabel}
      />
      <MarketCyclesCard dataset={dataset} months={frame.months} />
    </>
  );
}
