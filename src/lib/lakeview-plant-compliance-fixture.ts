/** Demo fixture — Lakeview Ethanol plant compliance (not platform audit) */

export type ComplianceStatus = "good" | "watch" | "critical";

export type ComplianceZone = {
  id: string;
  label: string;
  status: ComplianceStatus;
  summary: string;
  metric: string;
};

export type IndustryChallenge = {
  id: string;
  title: string;
  whyItMatters: string;
  lakeviewProcess: string;
  ethOsSupport: string;
  owner: string;
  severity: ComplianceStatus;
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

export type ProcessPlaybook = {
  step: number;
  title: string;
  detail: string;
  artifact: string;
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

export const ETHANOL_INDUSTRY_CHALLENGES: IndustryChallenge[] = [
  {
    id: "late-lab",
    title: "Missed or late fermentation samples",
    whyItMatters:
      "Without 6h–55h checkpoints, potential and acetic trajectories are blind — the #1 root cause of late intervention and failed audits.",
    lakeviewProcess:
      "Lab posts to Ferm Data sheet on schedule; supervisor verifies checkpoint column before handover. Overdue sample triggers DDL + hold on batch advance.",
    ethOsSupport:
      "Agenda + Batches matrix show posted vs. pending checkpoints; Potential vs Temp playbook fires before operators rely on memory.",
    owner: "QA / Lab · Supervisor",
    severity: "critical",
  },
  {
    id: "temp-potential",
    title: "Temperature–potential drift mid-ferment",
    whyItMatters:
      "Ethanol plants lose margin and risk off-spec beer well when cooling lags while potential still reads acceptable.",
    lakeviewProcess:
      "Compare DCS fermenter temp to lab row at same hour; adjust cooling per SOP; document in SHO if unresolved across shift.",
    ethOsSupport:
      "Batch 6418 demo path — DCS live + 18h lab + Daily Demo alert; action items enforce compare-before-correct.",
    owner: "Operational · Supervisor",
    severity: "watch",
  },
  {
    id: "acetic",
    title: "Acetic acid / infection-risk clusters",
    whyItMatters:
      "Early acetic rise paired with weak cell count or potential is a leading indicator of bad-batch outcomes — not visible in DCS alone.",
    lakeviewProcess:
      "YP and 6h rows reviewed by QA; cluster match escalates to supervisor before cascade; never auto-dump without sign-off.",
    ethOsSupport:
      "Acetic playbook uses same Ferm dictionary rows as Batches matrix; flagged watch on batch workspace.",
    owner: "QA / Lab",
    severity: "watch",
  },
  {
    id: "yield-deviation",
    title: "Yield deviation at ferm drop",
    whyItMatters:
      "Gal/bu below plant standard affects RIN generation documentation and customer commitments — needs CAPA, not just ops notes.",
    lakeviewProcess:
      "BPR updated at drop; QA opens deviation (6391 pattern); root cause tied to missed 40h sample or temp excursion.",
    ethOsSupport:
      "Batch status deviation + playbook audit trail + linked QLS report fields.",
    owner: "QA · Company Admin",
    severity: "critical",
  },
  {
    id: "shift-continuity",
    title: "Broken shift documentation chain",
    whyItMatters:
      "Auditors ask: what did night shift know at 06:00? Missing SHO or open alerts without handover = compliance gap.",
    lakeviewProcess:
      "SHO every 12h (Day/Night); open alerts and batch status copied from Agenda; incoming shift acknowledges priorities.",
    ethOsSupport:
      "Auto SHO demo + Reports filter by day; alert lifecycle and comments preserved on record.",
    owner: "Supervisor · Shift lead",
    severity: "watch",
  },
  {
    id: "traceability",
    title: "Input traceability (corn, yeast, additions)",
    whyItMatters:
      "Recall or spec investigation requires prop additions, YP batch, and fermenter route — not just batch ID.",
    lakeviewProcess:
      "Prop additions entered at YP send; corn source on batch identity; beer well receipt closes the chain.",
    ethOsSupport:
      "Batch workspace prop panel + Ferm dictionary signal IDs; BPR template fields.",
    owner: "Operational · QA",
    severity: "good",
  },
  {
    id: "rin-chain",
    title: "Biofuel / RIN documentation chain",
    whyItMatters:
      "EPA pathway requires defensible volume and feedstock records from grind through denatured rack.",
    lakeviewProcess:
      "Bushels charged, beer gal at drop, gal/bu calc on BPR; margin desk snapshot optional on financial close.",
    ethOsSupport:
      "Batch yield KPIs + completed batch 6398 reference path; FMR template when commodity feed on.",
    owner: "Supervisor · Admin",
    severity: "good",
  },
  {
    id: "env-permit",
    title: "Environmental permit & emissions reporting",
    whyItMatters:
      "Missed monthly stack or wastewater logs create regulatory exposure separate from production KPIs.",
    lakeviewProcess:
      "Environmental rounds logged in DOR; deviations to DDL within 24h; annual audit binder includes shift samples.",
    ethOsSupport:
      "DOR template sections + DDL incidents; Compliance dashboard tracks open items (demo).",
    owner: "Company Admin · Maintenance",
    severity: "good",
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

export const LAKEVIEW_QA_PROCESS: ProcessPlaybook[] = [
  {
    step: 1,
    title: "Verify lab checkpoint posted",
    detail:
      "Confirm YP and hourly row exist in Ferm Data before acting on DCS alone. Lakeview standard: no setpoint change without matching lab row.",
    artifact: "Ferm Data sheet · Batches matrix",
  },
  {
    step: 2,
    title: "Run playbook if rule fires",
    detail:
      "Complete action items in order; log lifecycle on Agenda; escalate critical to supervisor within 30 min.",
    artifact: "Agenda alert · Audit trail",
  },
  {
    step: 3,
    title: "Update shift record",
    detail:
      "Copy open alerts and batch status into SHO; note cooling or acetic actions for incoming shift.",
    artifact: "SHO · Reports (today filter)",
  },
  {
    step: 4,
    title: "QA review & release",
    detail:
      "QA signs QLS hold/release; deviation batches (6391 pattern) require CAPA before next fill on same ferm.",
    artifact: "QLS · BPR deviation section",
  },
  {
    step: 5,
    title: "Close the loop at drop",
    detail:
      "Beer well receipt, gal/bu vs 2.85 std, prop additions trace — BPR complete before CIP sign-off.",
    artifact: "BPR · Batch workspace drop row",
  },
];

export const LAKEVIEW_ADVISOR_TIPS = [
  "At Lakeview, the costliest gap is not missing data — it is sample posted late while DCS already moved. Always pair lab row + live tag before corrective action.",
  "Treat acetic at YP and 6h as early warning, not noise. QA wants the cluster row cited in QLS, not a verbal handover.",
  "SHO is your compliance backbone: if it is not in SHO, an auditor will assume it did not happen.",
  "Yield deviations without a named CAPA owner fail plant audits — link DDL to batch ID and playbook rule row.",
  "For RIN defensibility, bushels charged and beer gal at drop must match BPR — margin desk is supporting evidence, not the primary record.",
];
