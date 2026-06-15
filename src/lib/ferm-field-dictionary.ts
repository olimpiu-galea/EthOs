/**
 * Field layout from Ferm Data — Field Dictionary.xlsx (Section Layout).
 * Imported to public/fixtures/ferm-data-sheet.csv via scripts/import-ferm-field-dictionary.mjs
 */

export const FERM_CHECKPOINT_HOURS = [6, 12, 18, 24, 30, 40, 50, 55] as const;

export type FermCheckpointHour = (typeof FERM_CHECKPOINT_HOURS)[number];

export type FermCheckpointKey = "yp" | FermCheckpointHour | "drop" | "beerWell";

export const FERM_CHECKPOINT_COLUMNS: {
  key: FermCheckpointKey;
  label: string;
  short: string;
}[] = [
  { key: "yp", label: "Yeast prop send", short: "YP" },
  ...FERM_CHECKPOINT_HOURS.map((h) => ({
    key: h as FermCheckpointKey,
    label: `Ferm ${h} hours`,
    short: `${h}h`,
  })),
  { key: "drop", label: "Ferm drop", short: "Drop" },
  { key: "beerWell", label: "Beer well", short: "Beer" },
];

/** Primary lab fields operators track at each checkpoint (dictionary rows) */
export const FERM_MATRIX_FIELDS = [
  { key: "temp", label: "Temp", unit: "°F", signal: "TEMP" },
  { key: "potential", label: "Potential", unit: "%", signal: "POTENTIAL" },
  { key: "ethanol", label: "Ethanol", unit: "%", signal: "ETHANOL" },
  { key: "sugars", label: "Sugars", unit: "%", signal: "SUGARS" },
  { key: "acetic", label: "Acetic", unit: "", signal: "ACETIC" },
  { key: "ph", label: "pH", unit: "", signal: "PH" },
  { key: "brix", label: "Brix", unit: "°Bx", signal: "BRIX" },
  {
    key: "cellCount",
    label: "Cell count",
    unit: "M/mL",
    signal: "CELL-COUNT",
    earlyOnly: true,
  },
  {
    key: "viability",
    label: "Viability",
    unit: "%",
    signal: "VIABILITY-",
    earlyOnly: true,
  },
] as const;

export type FermMatrixFieldKey = (typeof FERM_MATRIX_FIELDS)[number]["key"];

export const FERM_PROCESS_SECTIONS = [
  "Batch identity",
  "Yeast prop send",
  "Time-indexed lab (6h–55h)",
  "Ferm drop & beer well",
  "Prop additions",
  "Ferm additions",
] as const;

export const FERM_DCS_SIGNAL_GROUPS = [
  {
    group: "Fermenter",
    fields: ["TE fermenter °F", "LI level %", "FIC agitator amps", "Cooling valve %"],
  },
  {
    group: "Fill & route",
    fields: ["YV fill / route", "FIC mash feed GPM", "Batch route valve"],
  },
  {
    group: "Beer well",
    fields: ["Beer well level", "Drop valve status", "Commingle line"],
  },
] as const;

export function fermSignalId(
  checkpoint: FermCheckpointKey,
  fieldSignal: string,
): string {
  if (checkpoint === "yp") return `FERM-YP-${fieldSignal}/_.Value`;
  if (checkpoint === "drop") return `FERM-FERM-DROP-${fieldSignal}/_.Value`;
  if (checkpoint === "beerWell") return `FERM-BEER-WELL-${fieldSignal}/_.Value`;
  return `FERM-${checkpoint}H-${fieldSignal}/_.Value`;
}

export function computePotential(ethanol: number, sugars: number): number {
  return Math.round((ethanol + 0.51 * sugars) * 100) / 100;
}

export function nearestCheckpointHour(ageH: number): FermCheckpointHour {
  let best: FermCheckpointHour = 6;
  for (const h of FERM_CHECKPOINT_HOURS) {
    if (ageH >= h) best = h;
  }
  return best;
}

export function nextCheckpointHour(ageH: number): FermCheckpointHour | null {
  return FERM_CHECKPOINT_HOURS.find((h) => h > ageH) ?? null;
}

export function formatMatrixValue(
  value: number | undefined,
  unit: string,
): string {
  if (value === undefined) return "—";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit ? `${formatted}${unit === "%" ? "%" : ` ${unit}`}` : formatted;
}
