/** Ethanol batch workspace — aligned with Ferm Data field dictionary & plant playbooks */

import {
  computePotential,
  type FermCheckpointKey,
} from "./ferm-field-dictionary";

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

export type LabCheckpointReading = {
  checkpoint: FermCheckpointKey;
  posted: boolean;
  temp?: number;
  ph?: number;
  brix?: number;
  ethanol?: number;
  sugars?: number;
  potential?: number;
  acetic?: number;
  cellCount?: number;
  viability?: number;
  sampledAt?: string;
};

export type DcsLiveReading = {
  signalId: string;
  label: string;
  value: string;
  unit?: string;
  status?: "ok" | "watch" | "critical";
  desc?: string;
};

export type PlaybookWatchItem = {
  playbook: string;
  status: "clear" | "watch" | "flagged";
  detail: string;
};

export type PropAddition = {
  item: string;
  amount: string;
  signalId?: string;
};

export type BatchRecord = {
  id: string;
  ferm: string;
  fermenterLetter: "A" | "B" | "C" | "D";
  status: "active" | "completed" | "deviation";
  started: string;
  fillCompleteAt?: string;
  fermDropAt?: string;
  yeastStrain: string;
  cornSource: string;
  yeastPropBatch: string;
  bushelsCharged: number;
  targetGalPerBu: number;
  projectedGalPerBu: number;
  beerGalAtDrop: number | null;
  brixDrop: number;
  fermenterAgeH: number;
  phases: BatchPhase[];
  events: BatchEvent[];
  kpis: { label: string; value: string; field: string }[];
  labCheckpoints: LabCheckpointReading[];
  dcsLive: DcsLiveReading[];
  propAdditions: PropAddition[];
  playbookWatch: PlaybookWatchItem[];
  operatorNote?: string;
};

export const BATCH_FIELD_GROUPS = [
  {
    group: "Batch identity",
    fields: ["Batch #", "Ferm", "Yeast strain", "Corn source", "YP batch", "Fill complete"],
  },
  {
    group: "Time-indexed lab",
    fields: [
      "6h Temp · Potential · Acetic",
      "12h Temp · Potential · Acetic",
      "18h Temp · Potential · Acetic",
      "24h Ethanol · Sugars · Brix",
      "30h–55h trajectory",
      "Ferm drop · Beer well",
    ],
  },
  {
    group: "Process markers",
    fields: [
      "Fill complete",
      "YP send",
      "Cascade engaged",
      "Ferm drop",
      "Beer well receipt",
      "Post-batch CIP",
    ],
  },
  {
    group: "DCS-linked",
    fields: [
      "TE fermenter °F",
      "LI level %",
      "Cooling valve %",
      "FIC agitator amps",
      "YV fill / route",
    ],
  },
] as const;

/** @deprecated Use BATCH_FIELD_GROUPS */
export const FERM_FIELD_GROUPS = BATCH_FIELD_GROUPS;

function lab(
  checkpoint: FermCheckpointKey,
  posted: boolean,
  data: Omit<LabCheckpointReading, "checkpoint" | "posted"> = {},
): LabCheckpointReading {
  const ethanol = data.ethanol;
  const sugars = data.sugars;
  const potential =
    data.potential ??
    (ethanol !== undefined && sugars !== undefined
      ? computePotential(ethanol, sugars)
      : undefined);
  return { checkpoint, posted, ...data, potential };
}

export const MOCK_BATCHES: BatchRecord[] = [
  {
    id: "6418",
    ferm: "Ferm B",
    fermenterLetter: "B",
    status: "active",
    started: "2026-06-07 14:00",
    fillCompleteAt: "2026-06-07 18:20",
    yeastStrain: "Ethanol Red",
    cornSource: "Local #2 yellow",
    yeastPropBatch: "YP-0612-B",
    bushelsCharged: 38_500,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.78,
    beerGalAtDrop: null,
    brixDrop: 4.6,
    fermenterAgeH: 18,
    operatorNote:
      "Cooling response lagging vs setpoint — matches Demo alarm on Agenda. Valve opened to 72%; re-check at 24h sample.",
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Yeast prop send", short: "YP", durationH: 2, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 32, status: "active" },
      { id: "cascade", label: "Cascade cooling", short: "Cascade", durationH: 6, status: "pending" },
      { id: "drop", label: "Ferm drop", short: "Drop", durationH: 2, status: "pending" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "pending" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "pending" },
    ],
    events: [
      { ts: "18:20", type: "phase", summary: "Fill complete — 38,500 bu charged", field: "Fill complete" },
      { ts: "20:05", type: "phase", summary: "YP send posted — cell count in spec", field: "YP send" },
      { ts: "02:00", type: "sample", summary: "6h lab row — temp on target", field: "FERM-6H-TEMP/_.Value" },
      { ts: "08:00", type: "sample", summary: "12h lab row posted", field: "FERM-12H-POTENTIAL/_.Value" },
      { ts: "08:00", type: "alert", summary: "Demo alarm — cooling slower than expected", field: "Cooling valve %" },
      { ts: "14:00", type: "sample", summary: "18h lab row — temp elevated", field: "FERM-18H-TEMP/_.Value" },
      { ts: "14:05", type: "signal", summary: "Cooling valve 72% open — DCS trend flat", field: "FermB_Cooling_SP" },
    ],
    kpis: [
      { label: "Potential @ 18h", value: "14.2%", field: "FERM-18H-POTENTIAL/_.Value" },
      { label: "Ferm temp (live)", value: "91.4 °F", field: "FERM-18H-TEMP/_.Value" },
      { label: "Cooling valve", value: "72% open", field: "Cooling valve %" },
      { label: "Yield proj.", value: "2.78 gal/bu", field: "Ferm drop ethanol" },
    ],
    labCheckpoints: [
      lab("yp", true, {
        temp: 86.2,
        ph: 4.8,
        brix: 11.2,
        ethanol: 0.4,
        sugars: 22.1,
        acetic: 0.08,
        cellCount: 118,
        viability: 94,
        sampledAt: "Jun 7 · 20:05",
      }),
      lab(6, true, {
        temp: 88.5,
        ph: 4.7,
        brix: 10.8,
        ethanol: 2.1,
        sugars: 20.4,
        acetic: 0.09,
        cellCount: 102,
        viability: 92,
        sampledAt: "Jun 8 · 02:00",
      }),
      lab(12, true, {
        temp: 89.8,
        ph: 4.65,
        brix: 9.9,
        ethanol: 4.8,
        sugars: 18.2,
        acetic: 0.11,
        sampledAt: "Jun 8 · 08:00",
      }),
      lab(18, true, {
        temp: 91.4,
        ph: 4.62,
        brix: 9.1,
        ethanol: 7.6,
        sugars: 13.0,
        acetic: 0.14,
        sampledAt: "Jun 8 · 14:00",
      }),
      lab(24, false),
      lab(30, false),
      lab(40, false),
      lab(50, false),
      lab(55, false),
      lab("drop", false),
      lab("beerWell", false),
    ],
    dcsLive: [
      {
        signalId: "DCS-FermB-TE/_.Value",
        label: "TE fermenter",
        value: "91.4",
        unit: "°F",
        status: "watch",
        desc: "Above 18h band target — cooling engaged",
      },
      {
        signalId: "DCS-FermB-LI/_.Value",
        label: "LI level",
        value: "78",
        unit: "%",
        status: "ok",
      },
      {
        signalId: "DCS-FermB-Cooling/_.Value",
        label: "Cooling valve",
        value: "72",
        unit: "% open",
        status: "watch",
        desc: "Increased 04:15 per SHO — trend flat",
      },
      {
        signalId: "DCS-FermB-Agit/_.Value",
        label: "Agitator amps",
        value: "142",
        unit: "A",
        status: "ok",
      },
      {
        signalId: "DCS-FermB-YV/_.Value",
        label: "YV route",
        value: "Ferm B → cascade",
        status: "ok",
      },
      {
        signalId: "DCS-FermB-FIC/_.Value",
        label: "Mash feed (hold)",
        value: "0",
        unit: "GPM",
        status: "ok",
      },
    ],
    propAdditions: [
      { item: "Yeast", amount: "42 kg", signalId: "FERM-PROP-ADDITIONS-YEAST-AMOUNT/_.Value" },
      { item: "Urea", amount: "18 lb", signalId: "FERM-PROP-ADDITIONS-UREA-AMOUNT/_.Value" },
      { item: "GA", amount: "2.1 gal", signalId: "FERM-PROP-ADDITIONS-GA-AMOUNT/_.Value" },
      { item: "Defoamer", amount: "0.8 gal", signalId: "FERM-PROP-ADDITIONS-DEFOAMER-AMOUNT/_.Value" },
      { item: "Antibiotics #1", amount: "Spectrum 880 · 12 mL", signalId: "FERM-PROP-ADDITIONS-ANTIBIOTICS-1/_.Value" },
    ],
    playbookWatch: [
      {
        playbook: "Daily demo alarm",
        status: "flagged",
        detail: "Open on Agenda — cooling response review",
      },
      {
        playbook: "Potential vs temperature",
        status: "watch",
        detail: "18h potential 14.2% — margin to temp cap at 24h",
      },
      {
        playbook: "Acetic infection risk",
        status: "clear",
        detail: "Acetic 0.14 @ 18h — below YP cluster threshold",
      },
    ],
  },
  {
    id: "6402",
    ferm: "Ferm A",
    fermenterLetter: "A",
    status: "active",
    started: "2026-06-06 06:00",
    fillCompleteAt: "2026-06-06 10:15",
    yeastStrain: "Superstart",
    cornSource: "Rail #2 + milo blend",
    yeastPropBatch: "YP-0610-A",
    bushelsCharged: 39_200,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.86,
    beerGalAtDrop: null,
    brixDrop: 5.0,
    fermenterAgeH: 42,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Yeast prop send", short: "YP", durationH: 2, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 34, status: "active" },
      { id: "cascade", label: "Cascade cooling", short: "Cascade", durationH: 6, status: "pending" },
      { id: "drop", label: "Ferm drop", short: "Drop", durationH: 2, status: "pending" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "pending" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "pending" },
    ],
    events: [
      { ts: "10:15", type: "phase", summary: "Fill complete", field: "Fill complete" },
      { ts: "12h", type: "sample", summary: "12h potential on track", field: "FERM-12H-POTENTIAL/_.Value" },
      { ts: "30h", type: "sample", summary: "30h row — ethanol conversion strong", field: "FERM-30H-ETHANOL/_.Value" },
      { ts: "40h", type: "alert", summary: "Potential vs temp — margin narrowing", field: "FERM-40H-POTENTIAL/_.Value" },
    ],
    kpis: [
      { label: "Potential @ 40h", value: "15.8%", field: "FERM-40H-POTENTIAL/_.Value" },
      { label: "Ferm temp", value: "92.1 °F", field: "FERM-40H-TEMP/_.Value" },
      { label: "Yield proj.", value: "2.86 gal/bu", field: "Projected close" },
      { label: "Next sample", value: "50h · ~8h", field: "Schedule" },
    ],
    labCheckpoints: [
      lab("yp", true, { temp: 85.8, ph: 4.85, ethanol: 0.3, sugars: 23.0, acetic: 0.07, cellCount: 125, viability: 96, sampledAt: "Jun 6 · 12:00" }),
      lab(6, true, { temp: 87.2, ethanol: 2.4, sugars: 21.0, acetic: 0.08, sampledAt: "Jun 6 · 18:00" }),
      lab(12, true, { temp: 88.0, ethanol: 5.2, sugars: 18.5, acetic: 0.09, sampledAt: "Jun 7 · 00:00" }),
      lab(18, true, { temp: 89.1, ethanol: 8.1, sugars: 15.2, acetic: 0.10, sampledAt: "Jun 7 · 06:00" }),
      lab(24, true, { temp: 90.0, ethanol: 10.4, sugars: 12.8, acetic: 0.11, sampledAt: "Jun 7 · 12:00" }),
      lab(30, true, { temp: 90.8, ethanol: 11.8, sugars: 10.2, acetic: 0.12, sampledAt: "Jun 7 · 18:00" }),
      lab(40, true, { temp: 92.1, ethanol: 13.2, sugars: 7.4, acetic: 0.15, sampledAt: "Jun 8 · 04:00" }),
      lab(50, false),
      lab(55, false),
      lab("drop", false),
      lab("beerWell", false),
    ],
    dcsLive: [
      { signalId: "DCS-FermA-TE/_.Value", label: "TE fermenter", value: "92.1", unit: "°F", status: "watch" },
      { signalId: "DCS-FermA-LI/_.Value", label: "LI level", value: "74", unit: "%", status: "ok" },
      { signalId: "DCS-FermA-Cooling/_.Value", label: "Cooling valve", value: "58", unit: "% open", status: "ok" },
      { signalId: "DCS-FermA-Agit/_.Value", label: "Agitator amps", value: "138", unit: "A", status: "ok" },
    ],
    propAdditions: [
      { item: "Yeast", amount: "44 kg" },
      { item: "Urea", amount: "19 lb" },
      { item: "Protease", amount: "1.2 gal" },
    ],
    playbookWatch: [
      { playbook: "Potential vs temperature", status: "watch", detail: "40h checkpoint — temp approaching cap for strain row" },
      { playbook: "Acetic infection risk", status: "clear", detail: "Acetic stable vs historical bad-batch clusters" },
    ],
  },
  {
    id: "6398",
    ferm: "Ferm C",
    fermenterLetter: "C",
    status: "completed",
    started: "2026-05-30 05:30",
    fillCompleteAt: "2026-05-30 09:45",
    fermDropAt: "2026-06-01 14:20",
    yeastStrain: "Ethanol Red",
    cornSource: "Local #2 yellow",
    yeastPropBatch: "YP-0528-C",
    bushelsCharged: 38_900,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.91,
    beerGalAtDrop: 113_200,
    brixDrop: 5.2,
    fermenterAgeH: 52,
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 4, status: "done" },
      { id: "prop", label: "Yeast prop send", short: "YP", durationH: 2, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 30, status: "done" },
      { id: "cascade", label: "Cascade cooling", short: "Cascade", durationH: 5, status: "done" },
      { id: "drop", label: "Ferm drop", short: "Drop", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 1, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "Drop", type: "phase", summary: "Ferm drop @ 50h — 2.91 gal/bu projected", field: "Ferm drop" },
      { ts: "+0.06", type: "signal", summary: "+0.06 gal/bu vs plant avg", field: "Beer well ethanol" },
    ],
    kpis: [
      { label: "Yield @ drop", value: "2.91 gal/bu", field: "FERM-FERM-DROP-ETHANOL/_.Value" },
      { label: "Beer to well", value: "113,200 gal", field: "Beer well receipt" },
      { label: "Drop potential", value: "16.4%", field: "FERM-FERM-DROP-POTENTIAL/_.Value" },
    ],
    labCheckpoints: [
      lab("yp", true, { temp: 86.0, ethanol: 0.5, sugars: 21.8, acetic: 0.07, cellCount: 120, viability: 95 }),
      lab(6, true, { temp: 87.5, ethanol: 2.2, sugars: 19.8, acetic: 0.08 }),
      lab(12, true, { temp: 88.2, ethanol: 5.0, sugars: 17.5, acetic: 0.09 }),
      lab(18, true, { temp: 89.0, ethanol: 8.0, sugars: 14.5, acetic: 0.10 }),
      lab(24, true, { temp: 89.8, ethanol: 10.2, sugars: 11.8, acetic: 0.11 }),
      lab(30, true, { temp: 90.5, ethanol: 11.5, sugars: 9.5, acetic: 0.12 }),
      lab(40, true, { temp: 91.0, ethanol: 12.8, sugars: 7.0, acetic: 0.13 }),
      lab(50, true, { temp: 91.2, ethanol: 13.8, sugars: 5.2, acetic: 0.14 }),
      lab(55, true, { temp: 91.0, ethanol: 14.0, sugars: 4.5, acetic: 0.14 }),
      lab("drop", true, { temp: 90.5, ethanol: 14.2, sugars: 4.0, acetic: 0.15, potential: 16.4, sampledAt: "Jun 1 · 14:20" }),
      lab("beerWell", true, { temp: 90.2, ethanol: 14.0, sugars: 4.2, acetic: 0.15, sampledAt: "Jun 1 · 15:00" }),
    ],
    dcsLive: [],
    propAdditions: [
      { item: "Yeast", amount: "41 kg" },
      { item: "Urea", amount: "18 lb" },
    ],
    playbookWatch: [
      { playbook: "Potential vs temperature", status: "clear", detail: "Closed within band all checkpoints" },
      { playbook: "Acetic infection risk", status: "clear", detail: "No cluster match at drop" },
    ],
  },
  {
    id: "6391",
    ferm: "Ferm D",
    fermenterLetter: "D",
    status: "deviation",
    started: "2026-05-22 07:20",
    fillCompleteAt: "2026-05-22 11:40",
    fermDropAt: "2026-05-24 16:10",
    yeastStrain: "Superstart",
    cornSource: "High moisture corn",
    yeastPropBatch: "YP-0520-D",
    bushelsCharged: 39_800,
    targetGalPerBu: 2.85,
    projectedGalPerBu: 2.68,
    beerGalAtDrop: 106_700,
    brixDrop: 4.1,
    fermenterAgeH: 56,
    operatorNote: "Yield deviation — 40h sample overdue contributed to late correction.",
    phases: [
      { id: "prep", label: "Prep & pre-CIP", short: "Prep", durationH: 2, status: "done" },
      { id: "fill", label: "Fill", short: "Fill", durationH: 5, status: "done" },
      { id: "prop", label: "Yeast prop send", short: "YP", durationH: 3, status: "done" },
      { id: "ferm", label: "Fermentation", short: "Ferm", durationH: 32, status: "done" },
      { id: "cascade", label: "Cascade cooling", short: "Cascade", durationH: 7, status: "done" },
      { id: "drop", label: "Ferm drop", short: "Drop", durationH: 2, status: "done" },
      { id: "flush", label: "Line flush", short: "Flush", durationH: 2, status: "done" },
      { id: "cip", label: "Post-batch CIP", short: "CIP", durationH: 3, status: "done" },
    ],
    events: [
      { ts: "32h", type: "alert", summary: "40h sample overdue", field: "FERM-40H-TEMP/_.Value" },
      { ts: "Drop", type: "alert", summary: "Yield below target — QA deviation opened", field: "Ferm drop ethanol" },
    ],
    kpis: [
      { label: "Yield @ drop", value: "2.68 gal/bu", field: "FERM-FERM-DROP-ETHANOL/_.Value" },
      { label: "Gap vs std", value: "−0.17 gal/bu", field: "Target" },
      { label: "Drop acetic", value: "0.22", field: "FERM-FERM-DROP-ACETIC/_.Value" },
    ],
    labCheckpoints: [
      lab("yp", true, { temp: 86.5, acetic: 0.09, cellCount: 108, viability: 88 }),
      lab(6, true, { temp: 88.0, acetic: 0.10 }),
      lab(12, true, { temp: 89.5, acetic: 0.12 }),
      lab(18, true, { temp: 90.8, acetic: 0.14 }),
      lab(24, true, { temp: 91.5, acetic: 0.16 }),
      lab(30, true, { temp: 92.0, acetic: 0.18 }),
      lab(40, false),
      lab(50, true, { temp: 93.1, ethanol: 12.0, sugars: 8.0, acetic: 0.22 }),
      lab(55, false),
      lab("drop", true, { temp: 92.8, ethanol: 12.5, sugars: 7.2, acetic: 0.22, potential: 15.2 }),
      lab("beerWell", true, { acetic: 0.21 }),
    ],
    dcsLive: [],
    propAdditions: [{ item: "Yeast", amount: "45 kg" }],
    playbookWatch: [
      { playbook: "Acetic infection risk", status: "flagged", detail: "Acetic trajectory matched bad-batch cluster at 30h" },
      { playbook: "Potential vs temperature", status: "flagged", detail: "Missed 40h checkpoint — temp above cap" },
    ],
  },
];

export function getBatchById(id: string): BatchRecord | undefined {
  return MOCK_BATCHES.find((b) => b.id === id);
}

export function getLabReading(
  batch: BatchRecord,
  checkpoint: FermCheckpointKey,
): LabCheckpointReading | undefined {
  return batch.labCheckpoints.find((c) => c.checkpoint === checkpoint);
}

export function postedCheckpoints(batch: BatchRecord): LabCheckpointReading[] {
  return batch.labCheckpoints.filter((c) => c.posted);
}
