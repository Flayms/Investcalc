import { useState } from "react";
import { MarketCyclesCard } from "@/features/market/MarketCyclesCard";
import { MarketStatusCard } from "@/features/market/MarketStatusCard";
import { type Dataset, getDataset } from "@/simulation/dataset";
import { type TimeFrameId, timeFrames } from "@/simulation/market";

/** The selected index and chart time frame, shared by the market cards. */
export function MarketView({ datasets }: { datasets: Record<string, Dataset> }) {
  const [id, setId] = useState("sp500");
  const [frameId, setFrameId] = useState<TimeFrameId>("5y");
  const dataset = getDataset(datasets, id);
  const frames = timeFrames(dataset);
  // Fall back to the whole history if the index is shorter than the chosen time frame.
  const frame =
    frames.find((f) => f.id === frameId && f.available) ??
    (frames.find((f) => f.id === "max") as (typeof frames)[number]);

  return (
    <>
      <MarketStatusCard
        datasets={datasets}
        dataset={dataset}
        onDatasetChange={setId}
        frames={frames}
        frame={frame}
        onFrameChange={setFrameId}
      />
      <MarketCyclesCard dataset={dataset} months={frame.months} />
    </>
  );
}
