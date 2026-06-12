import { parseDcsCsv } from "@/lib/dcs-parser";
import type { DcsTagWithKey } from "@/lib/types";

export type LabFieldSchema = {
  id: string;
  displayLabel: string;
};

export async function loadLabFixtureFields(): Promise<LabFieldSchema[]> {
  const res = await fetch("/fixtures/ferm-data-sheet.csv");
  if (!res.ok) throw new Error("Failed to load ferm data fixture.");
  const text = await res.text();
  return parseDcsCsv(text).map((t) => ({
    id: t.id,
    displayLabel: t.displayLabel,
  }));
}

export function validateUploadHeaders(
  headerLine: string,
  schema: LabFieldSchema[],
): string | null {
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  if (!headers.includes("id")) {
    return 'Upload must include an "id" column matching your mapped fields.';
  }
  const matched = schema.filter((f) => headers.includes(f.id.toLowerCase()));
  if (matched.length === 0) {
    return `No mapped field IDs in header. Expected: ${schema.map((f) => f.id).join(", ")}`;
  }
  return null;
}

export function parseLabUploadCsv(
  text: string,
  schema: LabFieldSchema[],
): { tags: DcsTagWithKey[]; error: string | null } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { tags: [], error: "File is empty or has no data rows." };
  }
  const headerErr = validateUploadHeaders(lines[0], schema);
  if (headerErr) return { tags: [], error: headerErr };

  const allTags = parseDcsCsv(text).map((t) => ({
    ...t,
    source: "lab" as const,
  }));
  const allowed = new Set(schema.map((f) => f.id));
  const tags = allTags.filter((t) => allowed.has(t.id));
  if (tags.length === 0) {
    return { tags: [], error: "No rows matched your selected lab fields." };
  }
  return { tags, error: null };
}
