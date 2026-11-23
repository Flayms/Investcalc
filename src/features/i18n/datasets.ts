import type { Messages } from "@/features/i18n/messages/en";

type DataText = { name: string; description?: string; source: string };

/** Name, description and source of a data file in the selected language, else the file's own. */
export function dataText<
  D extends { id: string; name: string; source: string; description?: string },
>(t: Messages, data: D): DataText {
  const text: DataText | undefined = (t.datasets as Record<string, DataText>)[data.id];
  return {
    name: text?.name ?? data.name,
    description: text?.description ?? data.description,
    source: text?.source ?? data.source,
  };
}
