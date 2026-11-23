import { MESSAGES } from "@/features/i18n/i18n";
import { de } from "@/features/i18n/messages/de";
import { en } from "@/features/i18n/messages/en";
import eur from "../../../public/data/eur.json";
import msciAcwi from "../../../public/data/msci-acwi.json";
import msciWorld from "../../../public/data/msci-world.json";
import sp500 from "../../../public/data/sp500.json";
import usMarket from "../../../public/data/us-market.json";

/** Every key path of a dictionary with the type of its value. */
function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return [`${path}: array`];
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
  return [`${path}: ${typeof value}`];
}

/** Every string of a dictionary, with its key path. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  return [];
}

test("REQ-014-01 the German dictionary has every English key and nothing else", () => {
  expect(shape(de)).toEqual(shape(en));
  expect(Object.keys(MESSAGES).sort()).toEqual(["de", "en"]);
});

test("REQ-014-01 no translation is empty", () => {
  for (const messages of [en, de]) {
    const empty = strings(messages).filter(([, s]) => s.trim() === "");
    expect(empty).toEqual([]);
  }
  expect(de.dataBasis.assumptions).toHaveLength(en.dataBasis.assumptions.length);
});

test("REQ-014-01 the English data texts are those of the data files", () => {
  const files = { sp500, "us-market": usMarket, "msci-world": msciWorld, "msci-acwi": msciAcwi };
  for (const [id, file] of Object.entries(files)) {
    const text = en.datasets[id as keyof typeof files];
    expect({ name: text.name, description: text.description, source: text.source }).toEqual({
      name: file.name,
      description: file.description,
      source: file.source,
    });
  }
  expect({ name: en.datasets.eur.name, source: en.datasets.eur.source }).toEqual({
    name: eur.name,
    source: eur.source,
  });
});

test("REQ-015-08 the SMA window help says when the signal is checked", () => {
  expect(en.fields.smaDays.help).toMatch(/every daily close/);
  expect(en.fields.smaDays.help).toMatch(/next close/);
  expect(en.fields.smaDays.help).toMatch(/once a month/);
  expect(de.fields.smaDays.help).toMatch(/Tagesschluss/);
});
