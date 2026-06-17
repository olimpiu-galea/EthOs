/** Demo fixture — Lakeview Ethanol compliance playbooks (POC list, edited on /playbooks) */

import {
  LAKEVIEW_COMPLIANCE_ZONES,
  LAKEVIEW_DOC_CADENCE,
  LAKEVIEW_OPEN_DEVIATIONS,
} from "./lakeview-plant-compliance-fixture";

export type CompliancePlaybookSeverity = "Warning" | "Critical";

export type CompliancePlaybook = {
  id: string;
  name: string;
  /** Min rule (trigger condition) shown in the watch panel */
  rule: string;
  severity: CompliancePlaybookSeverity;
};

export const COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID = "cmp-pb-ferm-log-gap";
export const COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID = "cmp-pb-deviation-overdue";

export const COMPLIANCE_PLAYBOOKS: CompliancePlaybook[] = [
  {
    id: COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID,
    name: "Fermentation Log Gap",
    rule: 'labSampleOverdue OR fermentationZoneStatus != "good"',
    severity: "Warning",
  },
  {
    id: COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
    name: "Deviation Overdue",
    rule: 'deviationStatus = "open" AND ownerActionPastDue',
    severity: "Critical",
  },
  {
    id: "cmp-pb-missing-daily-doc",
    name: "Missing Daily Doc",
    rule: 'requiredDailyDoc.todayStatus = "missing"',
    severity: "Warning",
  },
];

export type ComplianceWatchStatus = "clear" | "watch" | "flagged";

export type ComplianceWatchItem = {
  id: string;
  /** Playbook name shown in the watch panel */
  name: string;
  /** Min rule (trigger condition) */
  rule: string;
  status: ComplianceWatchStatus;
  count: number;
};

const LAB_ZONE_IDS = ["ferm-qa", "lab", "product"];

const COMPLIANCE_WATCH_PLAYBOOKS = COMPLIANCE_PLAYBOOKS.filter(
  (pb) =>
    pb.id === COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID ||
    pb.id === COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
);

function fermLogGapWatchStatus(): Pick<ComplianceWatchItem, "status" | "count"> {
  const labZones = LAKEVIEW_COMPLIANCE_ZONES.filter((z) =>
    LAB_ZONE_IDS.includes(z.id),
  );
  const labCritical = labZones.some((z) => z.status === "critical");
  const labWatch = labZones.filter((z) => z.status !== "good");

  return {
    status:
      labWatch.length === 0 ? "clear" : labCritical ? "flagged" : "watch",
    count: labWatch.length,
  };
}

function deviationOverdueWatchStatus(): Pick<ComplianceWatchItem, "status" | "count"> {
  const openDeviations = LAKEVIEW_OPEN_DEVIATIONS.filter(
    (d) => d.status === "open",
  );
  const investigatingDeviations = LAKEVIEW_OPEN_DEVIATIONS.filter(
    (d) => d.status === "investigating",
  );

  return {
    status:
      openDeviations.length > 0
        ? "flagged"
        : investigatingDeviations.length > 0
          ? "watch"
          : "clear",
    count: openDeviations.length + investigatingDeviations.length,
  };
}

/**
 * Compliance playbook watch items (batches-style panel).
 * "Fermentation Log Gap" is always listed first.
 */
export function complianceWatchItems(): ComplianceWatchItem[] {
  const ferm = fermLogGapWatchStatus();
  const deviation = deviationOverdueWatchStatus();

  return COMPLIANCE_WATCH_PLAYBOOKS.map((pb) => {
    const live =
      pb.id === COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID ? ferm : deviation;
    return {
      id: pb.id,
      name: pb.name,
      rule: pb.rule,
      status: live.status,
      count: live.count,
    };
  });
}
