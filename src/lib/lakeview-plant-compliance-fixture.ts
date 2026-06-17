/** Demo fixture — Lakeview Ethanol plant compliance (not platform audit) */

export type ComplianceStatus = "good" | "watch" | "critical";

export type ComplianceZone = {
  id: string;
  label: string;
  status: ComplianceStatus;
  summary: string;
  metric: string;
  details: string;
  recommendedAction: string;
  owner: string;
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
  details: string;
  impact: string;
  recommendedAction: string;
};

export type DocCadenceRow = {
  template: string;
  abbr: string;
  cadence: string;
  todayStatus: "complete" | "draft" | "missing" | "n/a";
  lastTitle: string;
  complianceNote: string;
  details: string;
  owner: string;
  recommendedAction: string;
};

export const LAKEVIEW_COMPLIANCE_ZONES: ComplianceZone[] = [
  {
    id: "ferm-qa",
    label: "Fermentation & QA",
    status: "watch",
    summary: "1 open deviation · 2 playbook flags on active ferm",
    metric: "2 active batches · 6418 flagged",
    details:
      "Batch 6418 has an open cooling-response deviation and two active playbook flags on Ferm B. QA review is pending on the 24h lab checkpoint.",
    recommendedAction:
      "Confirm 24h sample posted, review deviation owner assignment, and verify playbook responses on Agenda.",
    owner: "QA · Supervisor",
  },
  {
    id: "lab",
    label: "Lab schedule",
    status: "watch",
    summary: "24h sample due on 6418 · all prior checkpoints posted",
    metric: "YP→18h posted · 24h pending",
    details:
      "The 18h YP row for batch 6418 is complete. The 24h fermentation sample is due this shift and has not yet been released in the lab sheet.",
    recommendedAction:
      "Post the 24h sample before end of shift and update the fermentation log gap if sampling was delayed.",
    owner: "Lab · Operations liaison",
  },
  {
    id: "shift-docs",
    label: "Shift documentation",
    status: "good",
    summary: "SHO Day filed · DOR on track for 06:00",
    metric: "SHO · 12h cadence",
    details:
      "Day shift handover is filed. The daily operations report is in draft and on track for the 06:00 sign-off window.",
    recommendedAction: "No action required — continue DOR completion before shift turnover.",
    owner: "Shift supervisor",
  },
  {
    id: "trace",
    label: "Batch traceability",
    status: "good",
    summary: "Prop additions logged · Ferm Data dictionary aligned",
    metric: "6418 · 6402 trace OK",
    details:
      "Prop additions and Ferm Data dictionary entries are aligned for active batches 6418 and 6402.",
    recommendedAction: "No action required — maintain trace logging through drop.",
    owner: "Operations · QA",
  },
  {
    id: "product",
    label: "Product & biofuel",
    status: "watch",
    summary: "Yield proj. below std on 6418 · drop docs pending",
    metric: "2.78 vs 2.85 gal/bu target",
    details:
      "Projected yield on batch 6418 is 2.78 gal/bu against the 2.85 plant standard. Drop documentation is not yet complete for the active run.",
    recommendedAction:
      "Review yield projection with QA and prepare BPR sections before drop planning.",
    owner: "QA · Finance liaison",
  },
  {
    id: "safety-env",
    label: "Safety & environment",
    status: "good",
    summary: "No open DDL this shift · permit KPIs green",
    metric: "0 open incidents",
    details:
      "No downtime or deviation log entries are open for safety/environment this shift. Permit KPIs are within limits.",
    recommendedAction: "No action required — continue routine environmental rounds.",
    owner: "EHS · Operations",
  },
];

export const LAKEVIEW_OPEN_DEVIATIONS: DeviationRow[] = [
  {
    id: "dev-6418-cool",
    batchId: "6418",
    fermenter: "Ferm B",
    issue: "Cooling response lag — operations playbook alert open on Agenda",
    source: "Daily Demo playbook · DCS + 18h lab",
    status: "investigating",
    owner: "Operational → Supervisor",
    due: "This shift",
    link: "/operational?batch=6418",
    details:
      "Cooling response on Ferm B lagged outside the expected band during the 18h checkpoint window. DCS trend and lab sheet both triggered the operations playbook alert.",
    impact:
      "Risk of fermentation temperature drift and downstream yield impact if not corrected before the 24h sample.",
    recommendedAction:
      "Verify cooling valve response, document operator actions in the deviation record, and close the Agenda alert when mitigated.",
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
    link: "/operational?batch=6402",
    details:
      "At the 40h checkpoint, measured temperature approached the potential-derived control limit on batch 6402. The Potential vs Temp playbook fired on Agenda.",
    impact:
      "Elevated risk of bad-batch classification if the 50h checkpoint exceeds the control band.",
    recommendedAction:
      "Complete QA assessment before 50h sampling and document any temperature cap adjustments.",
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
    link: "/operational?batch=6391",
    details:
      "Batch 6391 missed the 40h checkpoint and shows yield 0.17 gal/bu below target. Acetic cluster indicators were flagged in the bad-batch playbook review.",
    impact:
      "Product release may be delayed pending CAPA and fermentation documentation review.",
    recommendedAction:
      "Open CAPA assignment, attach BPR evidence, and route for plant QA sign-off.",
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
    details:
      "Day shift handover was filed on time with open actions from batch 6418 carried forward.",
    owner: "Day shift supervisor",
    recommendedAction: "Incoming shift must acknowledge open actions during turnover.",
  },
  {
    template: "Daily Operations Report",
    abbr: "DOR",
    cadence: "Daily · as of 06:00",
    todayStatus: "draft",
    lastTitle: "DOR · today (draft)",
    complianceNote: "Environmental round + production summary pending sign-off",
    details:
      "Production summary and environmental round sections are still in draft. Sign-off is expected before the 06:00 daily cutoff.",
    owner: "Operations supervisor",
    recommendedAction: "Complete environmental round entry and obtain supervisor sign-off.",
  },
  {
    template: "Batch Production Record",
    abbr: "BPR",
    cadence: "Per batch · at drop",
    todayStatus: "n/a",
    lastTitle: "6398 closed · 6418 active",
    complianceNote: "Active ferm batches require live BPR until drop",
    details:
      "Batch 6398 BPR is closed. Batch 6418 BPR remains active through fermentation and drop.",
    owner: "QA · Operations",
    recommendedAction: "Continue live BPR updates for batch 6418 until drop is complete.",
  },
  {
    template: "Quality & Lab Summary",
    abbr: "QLS",
    cadence: "Per sample / daily rollup",
    todayStatus: "complete",
    lastTitle: "18h row · batch 6418",
    complianceNote: "Hold/release notes if spec exceeded",
    details:
      "The 18h lab summary for batch 6418 is posted. Hold/release notes are not required at this checkpoint.",
    owner: "Lab QA",
    recommendedAction: "No action required until the 24h sample is released.",
  },
  {
    template: "Downtime & Deviation Log",
    abbr: "DDL",
    cadence: "Per incident",
    todayStatus: "missing",
    lastTitle: "— none filed today",
    complianceNote: "File within 24h of equipment or process deviation",
    details:
      "No DDL entry has been filed today despite an active process deviation on batch 6418. Plant policy requires filing within 24h of the incident.",
    owner: "Operations · QA",
    recommendedAction:
      "File the DDL entry linking batch 6418 cooling deviation and cross-reference the open Agenda alert.",
  },
];
