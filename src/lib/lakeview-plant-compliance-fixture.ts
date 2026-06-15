/** Demo fixture — Lakeview Ethanol plant compliance (not platform audit) */

export type ComplianceStatus = "good" | "watch" | "critical";

export type ComplianceZone = {
  id: string;
  label: string;
  status: ComplianceStatus;
  summary: string;
  metric: string;
};

export type DeviationRow = {
  id: string;
  batchId: string;
  fermenter: string;
  issue: string;
  source: string;
  status: "open" | "investigating" | "closed";
  owner: string;
  due: string;
  link: string;
};

export type DocCadenceRow = {
  template: string;
  abbr: string;
  cadence: string;
  todayStatus: "complete" | "draft" | "missing" | "n/a";
  lastTitle: string;
  complianceNote: string;
};

export const LAKEVIEW_COMPLIANCE_ZONES: ComplianceZone[] = [
  {
    id: "ferm-qa",
    label: "Fermentation & QA",
    status: "watch",
    summary: "1 open deviation · 2 playbook flags on active ferm",
    metric: "2 active batches · 6418 flagged",
  },
  {
    id: "lab",
    label: "Lab schedule",
    status: "watch",
    summary: "24h sample due on 6418 · all prior checkpoints posted",
    metric: "YP→18h posted · 24h pending",
  },
  {
    id: "shift-docs",
    label: "Shift documentation",
    status: "good",
    summary: "SHO Day filed · DOR on track for 06:00",
    metric: "SHO · 12h cadence",
  },
  {
    id: "trace",
    label: "Batch traceability",
    status: "good",
    summary: "Prop additions logged · Ferm Data dictionary aligned",
    metric: "6418 · 6402 trace OK",
  },
  {
    id: "product",
    label: "Product & biofuel",
    status: "watch",
    summary: "Yield proj. below std on 6418 · drop docs pending",
    metric: "2.78 vs 2.85 gal/bu target",
  },
  {
    id: "safety-env",
    label: "Safety & environment",
    status: "good",
    summary: "No open DDL this shift · permit KPIs green",
    metric: "0 open incidents",
  },
];

export const LAKEVIEW_OPEN_DEVIATIONS: DeviationRow[] = [
  {
    id: "dev-6418-cool",
    batchId: "6418",
    fermenter: "Ferm B",
    issue: "Cooling response lag — Demo alarm open on Agenda",
    source: "Daily Demo playbook · DCS + 18h lab",
    status: "investigating",
    owner: "Operational → Supervisor",
    due: "This shift",
    link: "/batches?batch=6418",
  },
  {
    id: "dev-6402-margin",
    batchId: "6402",
    fermenter: "Ferm A",
    issue: "Potential vs temp margin narrowing @ 40h",
    source: "Potential vs Temp playbook",
    status: "open",
    owner: "Supervisor · QA review",
    due: "Before 50h sample",
    link: "/batches?batch=6402",
  },
  {
    id: "dev-6391-yield",
    batchId: "6391",
    fermenter: "Ferm D",
    issue: "Yield −0.17 gal/bu · missed 40h checkpoint",
    source: "BPR · Acetic cluster · DDL",
    status: "investigating",
    owner: "QA · CAPA owner TBD",
    due: "QA weekly",
    link: "/batches?batch=6391",
  },
];

export const LAKEVIEW_DOC_CADENCE: DocCadenceRow[] = [
  {
    template: "Shift Handover",
    abbr: "SHO",
    cadence: "Every 12h · Day 06:00 · Night 18:00",
    todayStatus: "complete",
    lastTitle: "SHO — Day · today",
    complianceNote: "Open actions from 6418 copied · incoming shift ack required",
  },
  {
    template: "Daily Operations Report",
    abbr: "DOR",
    cadence: "Daily · as of 06:00",
    todayStatus: "draft",
    lastTitle: "DOR · today (draft)",
    complianceNote: "Environmental round + production summary pending sign-off",
  },
  {
    template: "Batch Production Record",
    abbr: "BPR",
    cadence: "Per batch · at drop",
    todayStatus: "n/a",
    lastTitle: "6398 closed · 6418 active",
    complianceNote: "Active ferm batches require live BPR until drop",
  },
  {
    template: "Quality & Lab Summary",
    abbr: "QLS",
    cadence: "Per sample / daily rollup",
    todayStatus: "complete",
    lastTitle: "18h row · batch 6418",
    complianceNote: "Hold/release notes if spec exceeded",
  },
  {
    template: "Downtime & Deviation Log",
    abbr: "DDL",
    cadence: "Per incident",
    todayStatus: "missing",
    lastTitle: "— none filed today",
    complianceNote: "File within 24h of equipment or process deviation",
  },
];
