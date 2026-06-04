import type { DcsTag, DcsTagWithKey } from "./types";

const REQUIRED_HEADER =
  "id,value,name,desc,category,fieldType,frequency,displayLabel,unit";

function parseValue(raw: string): string | number | boolean {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const num = Number(trimmed);
  if (trimmed !== "" && !Number.isNaN(num)) return num;
  return trimmed;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export function parseDcsCsv(csvText: string): DcsTagWithKey[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row.");
  }

  const header = lines[0].trim();
  if (header.toLowerCase() !== REQUIRED_HEADER.toLowerCase()) {
    throw new Error(
      `Invalid CSV header. Expected exactly: ${REQUIRED_HEADER}`,
    );
  }

  const tags: DcsTagWithKey[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length !== 9) {
      throw new Error(`Row ${i + 1}: expected 9 columns, got ${cols.length}.`);
    }

    const tag: DcsTag = {
      id: cols[0],
      value: parseValue(cols[1]),
      name: cols[2],
      desc: cols[3],
      category: cols[4],
      fieldType: cols[5],
      frequency: cols[6],
      displayLabel: cols[7],
      unit: cols[8],
    };

    tags.push({
      ...tag,
      _key: `${tag.id}::${tag.displayLabel}::${i}`,
    });
  }

  return tags;
}

export function tagKey(tag: DcsTag | DcsTagWithKey): string {
  return "_key" in tag ? tag._key : `${tag.id}::${tag.displayLabel}`;
}

export function numericValue(value: string | number | boolean): number {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}
