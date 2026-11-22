import { useQuery } from "@tanstack/react-query";
import { type Dataset, datasetIds, datasetSchema } from "@/simulation/dataset";

export type DatasetLoader = (id: string) => Promise<unknown>;

export const fetchDataset: DatasetLoader = async (id) => {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${id}.json`);
  if (!res.ok) throw new Error(`Could not load ${id} (HTTP ${res.status})`);
  return res.json();
};

/** Loads and validates all historical datasets, keyed by id. */
export function useDatasets(load: DatasetLoader = fetchDataset) {
  return useQuery({
    queryKey: ["datasets"],
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const list = await Promise.all(
        datasetIds.map(async (id) => datasetSchema.parse(await load(id))),
      );
      return Object.fromEntries(list.map((d) => [d.id, d])) as Record<string, Dataset>;
    },
  });
}
