import { parseDcsCsv } from "@/lib/dcs-parser";
import type { DcsTagWithKey } from "@/lib/types";

let cached: DcsTagWithKey[] | null = null;

/** Ferm field dictionary — available even when Lab Sheet is not connected */
export async function loadFermCatalogTags(): Promise<DcsTagWithKey[]> {
  if (cached) return cached;
  const res = await fetch("/fixtures/ferm-data-sheet.csv");
  if (!res.ok) throw new Error("Failed to load ferm field catalog.");
  const text = await res.text();
  cached = parseDcsCsv(text).map((t) => ({
    ...t,
    source: "lab" as const,
  }));
  return cached;
}
