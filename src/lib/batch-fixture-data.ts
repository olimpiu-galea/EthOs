/** Mock batch model — aligned with Ferm Data field dictionary concepts */

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
  dropEtOH: number;
  brixDrop: number;
  fermenterAgeH: number;
  phases: BatchPhase[];
  events: BatchEvent[];
  kpis: { label: string; value: string; field: string }[];
};

/** Fields inspired by Ferm Data — Field Dictionary / vertical sheet */
export const FERM_FIELD_GROUPS = [
  {
    group: "Identity",
    fields: ["Batch #", "Ferm #", "Recipe", "Start date", "Drop date"],
  },
  {
    group: "Time-indexed lab",
    fields: [
      "6hr Temp",
      "12hr Temp",
      "18hr pH",
      "24hr Ethanol",
      "30hr Sugars",
      "40hr Brix",
      "50hr Potential",
      "55hr Lactic / Acetic",
    ],
  },
  {
    group: "Process markers",
    fields: [
      "Fill complete",
      "Yeast prop start",
      "Cascade engaged",
      "Drop end",
      "Line flush",
      "CIP complete",
    ],
  },
  {
    group: "DCS-linked",
    fields: [
      "LI level %",
      "FIC feed GPM",
      "TE fermenter °F",
      "DO mg/L",
      "YV fill / route",
    ],
  },
] as const;

export const MOCK_BATCHES: BatchRecord[] = [
  {
    id: "FRM-2847",
    ferm: "Ferm 12",
    status: "active",
    started: "2026-06-02 06:10",
    dropEtOH: 12.4,
    brixDrop: 4.8,
    fermenterAgeH: 38,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Yeast prop", short: "Prop", durationH: 3, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 28, status: "active" },
      { id: "cascade", label: "Cascade cooling", short: "Cas", durationH: 6, status: "pending" },
      { id: "drop", label: "Drop / harvest", short: "Drop", durationH: 2, status: "pending" },
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
      { label: "EtOH @ drop (proj.)", value: "12.6%", field: "24hr Ethanol" },
      { label: "pH now", value: "4.9", field: "18hr pH" },
      { label: "Ferm age", value: "38h", field: "Fermenter age" },
    ],
  },
  {
    id: "FRM-2846",
    ferm: "Ferm 11",
    status: "completed",
    started: "2026-05-28 05:55",
    dropEtOH: 13.1,
    brixDrop: 5.1,
    fermenterAgeH: 52,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Yeast prop", short: "Prop", durationH: 3, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 30, status: "done" },
      { id: "cascade", label: "Cascade cooling", short: "Cas", durationH: 5, status: "done" },
      { id: "drop", label: "Drop / harvest", short: "Drop", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "Drop", type: "phase", summary: "Drop end — EtOH 13.1%", field: "Drop end" },
      { ts: "+0.5%", type: "signal", summary: "Above target vs prior week avg", field: "24hr Ethanol" },
    ],
    kpis: [
      { label: "EtOH @ drop", value: "13.1%", field: "24hr Ethanol" },
      { label: "Brix @ drop", value: "5.1", field: "40hr Brix" },
      { label: "Total time", value: "52h", field: "Drop date" },
    ],
  },
  {
    id: "FRM-2840",
    ferm: "Ferm 09",
    status: "deviation",
    started: "2026-05-22 07:20",
    dropEtOH: 11.2,
    brixDrop: 4.2,
    fermenterAgeH: 56,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 5, status: "done" },
      { id: "prop", label: "Yeast prop", short: "Prop", durationH: 4, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 32, status: "done" },
      { id: "cascade", label: "Cascade cooling", short: "Cas", durationH: 7, status: "done" },
      { id: "drop", label: "Drop / harvest", short: "Drop", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 2, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "32h", type: "alert", summary: "Scheduled sample overdue", field: "40hr Brix" },
      { ts: "Drop", type: "alert", summary: "EtOH below target — flagged bad batch", field: "24hr Ethanol" },
    ],
    kpis: [
      { label: "EtOH @ drop", value: "11.2%", field: "24hr Ethanol" },
      { label: "Acetic peak", value: "High", field: "55hr Lactic / Acetic" },
      { label: "Status", value: "Deviation", field: "Batch #" },
    ],
  },
];
