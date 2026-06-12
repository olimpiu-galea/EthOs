/** Mock batch model — generic production batch fields */

export type BatchPhaseId =
  | "prep"
  | "fill"
  | "prop"
  | "ferm"
  | "cascade"
  | "drop"
  | "flush"
  | "cip";

export type BatchPhase = {
  id: BatchPhaseId;
  label: string;
  short: string;
  durationH: number;
  status: "done" | "active" | "pending";
};

export type BatchEvent = {
  ts: string;
  type: "sample" | "alert" | "phase" | "signal";
  summary: string;
  field?: string;
};

export type BatchRecord = {
  id: string;
  ferm: string;
  status: "active" | "completed" | "deviation";
  started: string;
  /** Bushels ground and charged to this fermenter fill */
  bushelsCharged: number;
  /** Plant standard gal denatured ethanol / bu */
  targetGalPerBu: number;
  /** Projected gal/bu from lab + in-process signals (fermenter close estimate) */
  projectedGalPerBu: number;
  /** Beer volume at drop to beer well (null while still fermenting) */
  beerGalAtDrop: number | null;
  brixDrop: number;
  fermenterAgeH: number;
  phases: BatchPhase[];
  events: BatchEvent[];
  kpis: { label: string; value: string; field: string }[];
};

/** Generic batch field groups — configurable per industry vertical */
export const BATCH_FIELD_GROUPS = [
  {
    group: "Identity",
    fields: ["Batch #", "Line #", "Recipe", "Start date", "Close date"],
  },
  {
    group: "Time-indexed lab",
    fields: [
      "6hr Temp",
      "12hr Temp",
      "18hr pH",
      "24hr Output",
      "30hr In-process",
      "40hr Quality",
      "50hr Potential",
      "55hr Contaminants",
    ],
  },
  {
    group: "Process markers",
    fields: [
      "Fill complete",
      "Prep complete",
      "Cascade engaged",
      "Close complete",
      "Line flush",
      "CIP complete",
    ],
  },
  {
    group: "DCS-linked",
    fields: [
      "LI level %",
      "FIC feed GPM",
      "TE reactor °F",
      "DO mg/L",
      "YV fill / route",
    ],
  },
] as const;

/** @deprecated Use BATCH_FIELD_GROUPS */
export const FERM_FIELD_GROUPS = BATCH_FIELD_GROUPS;

export const MOCK_BATCHES: BatchRecord[] = [
  {
    id: "LOT-2847",
    ferm: "Line 12",
    status: "active",
    started: "2026-06-02 06:10",
    bushelsCharged: 92400,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.72,
    beerGalAtDrop: null,
    brixDrop: 4.8,
    fermenterAgeH: 38,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Seed / prep", short: "Prep", durationH: 3, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 28, status: "active" },
      { id: "cascade", label: "Thermal conditioning", short: "Cond", durationH: 6, status: "pending" },
      { id: "drop", label: "Close / release", short: "Close", durationH: 2, status: "pending" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "pending" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "pending" },
    ],
    events: [
      { ts: "06:42", type: "phase", summary: "Fill complete — sample window opened", field: "Fill complete" },
      { ts: "09:15", type: "sample", summary: "12hr lab row posted", field: "12hr Temp" },
      { ts: "14:02", type: "alert", summary: "Fill rate low vs expected (playbook)", field: "FIC feed GPM" },
      { ts: "18:30", type: "signal", summary: "DO dipped below band", field: "DO-7701" },
    ],
    kpis: [
      { label: "Yield proj. (gal/bu)", value: "2.72", field: "24hr Output" },
      { label: "pH now", value: "4.9", field: "18hr pH" },
      { label: "Bushels charged", value: "92,400 bu", field: "Recipe" },
    ],
  },
  {
    id: "LOT-2846",
    ferm: "Line 11",
    status: "completed",
    started: "2026-05-28 05:55",
    bushelsCharged: 91800,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.91,
    beerGalAtDrop: 267_100,
    brixDrop: 5.1,
    fermenterAgeH: 52,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Seed / prep", short: "Prep", durationH: 3, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 30, status: "done" },
      { id: "cascade", label: "Thermal conditioning", short: "Cond", durationH: 5, status: "done" },
      { id: "drop", label: "Close / release", short: "Close", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "Close", type: "phase", summary: "Batch close — 2.91 gal/bu", field: "Close complete" },
      { ts: "+0.06", type: "signal", summary: "+0.06 gal/bu vs prior week avg", field: "24hr Output" },
    ],
    kpis: [
      { label: "Yield @ close", value: "2.91 gal/bu", field: "24hr Output" },
      { label: "Beer to well", value: "267,100 gal", field: "Close complete" },
      { label: "Ethanol equiv.", value: "267,138 gal", field: "24hr Output" },
    ],
  },
  {
    id: "LOT-2840",
    ferm: "Line 09",
    status: "deviation",
    started: "2026-05-22 07:20",
    bushelsCharged: 93100,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.68,
    beerGalAtDrop: 249_500,
    brixDrop: 4.2,
    fermenterAgeH: 56,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 5, status: "done" },
      { id: "prop", label: "Seed / prep", short: "Prep", durationH: 4, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 32, status: "done" },
      { id: "cascade", label: "Thermal conditioning", short: "Cond", durationH: 7, status: "done" },
      { id: "drop", label: "Close / release", short: "Close", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 2, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "32h", type: "alert", summary: "Scheduled sample overdue", field: "40hr Quality" },
      { ts: "Close", type: "alert", summary: "Yield below target — flagged deviation", field: "24hr Output" },
    ],
    kpis: [
      { label: "Yield @ close", value: "2.68 gal/bu", field: "24hr Output" },
      { label: "Gap vs std", value: "−0.17 gal/bu", field: "24hr Output" },
      { label: "Status", value: "Deviation", field: "Batch #" },
    ],
  },
];
