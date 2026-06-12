import type { SignalSource } from "./types";

/** Signal IDs aligned with Ferm Data — Field Dictionary (Section Layout) */

export function inferSignalSource(signalId: string): SignalSource {
  if (signalId.startsWith("FERM-") || signalId.startsWith("LAB-")) return "lab";
  if (signalId.startsWith("MKT-")) return "commodity";
  if (signalId.startsWith("INV-")) return "inventory";
  return "dcs";
}

export function fermTempSignal(hour: number | "yp"): string {
  if (hour === "yp") return "FERM-YP-TEMP/_.Value";
  return `FERM-${hour}H-TEMP/_.Value`;
}

export function fermPotentialSignal(hour: number | "yp"): string {
  if (hour === "yp") return "FERM-YP-POTENTIAL/_.Value";
  return `FERM-${hour}H-POTENTIAL/_.Value`;
}

export function fermAceticSignal(hour: number | "yp"): string {
  if (hour === "yp") return "FERM-YP-ACETIC/_.Value";
  return `FERM-${hour}H-ACETIC/_.Value`;
}

export function fermCellCountSignal(hour: number | "yp"): string {
  if (hour === "yp") return "FERM-YP-CELL-COUNT/_.Value";
  return `FERM-${hour}H-CELL-COUNT/_.Value`;
}

export type FermFieldLabel =
  | "Temp"
  | "Potential"
  | "Acetic"
  | "Cell Count";

export function fermSignalDisplayLabel(
  hour: number | "yp",
  field: FermFieldLabel,
): string {
  if (hour === "yp") {
    const yp: Record<FermFieldLabel, string> = {
      Temp: "YP Temp",
      Potential: "YP Potential",
      Acetic: "YP Acetic",
      "Cell Count": "YP Cell Count",
    };
    return yp[field];
  }
  return `Ferm ${hour} Hours ${field}`;
}

/** Strip legacy composite labels (signal · context) for UI display */
export function canonicalSignalLabel(rule: {
  signalId: string;
  displayLabel?: string;
}): string {
  const raw = rule.displayLabel ?? rule.signalId;
  const sep = raw.indexOf(" · ");
  return sep >= 0 ? raw.slice(0, sep) : raw;
}
