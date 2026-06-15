/** Demo fixture — Lakeview Ethanol compliance playbooks (POC list, edited on /playbooks) */

import {
  LAKEVIEW_COMPLIANCE_ZONES,
  LAKEVIEW_DOC_CADENCE,
  LAKEVIEW_OPEN_DEVIATIONS,
} from "./lakeview-plant-compliance-fixture";

export type ComplianceWatchStatus = "clear" | "watch" | "flagged";

export type ComplianceWatchItem = {
  id: string;
  /** Min title (placeholder-style summary) */
  title: string;
  /** Min rule (trigger condition) */
  rule: string;
  status: ComplianceWatchStatus;
  count: number;
};

const LAB_ZONE_IDS = ["ferm-qa", "lab", "product"];

/**
 * Top-3 compliance playbook watch items (batches-style panel).
 * Derived live from the compliance fixtures so the panel stays in sync.
 */
export function complianceWatchItems(): ComplianceWatchItem[] {
  const labZones = LAKEVIEW_COMPLIANCE_ZONES.filter((z) =>
    LAB_ZONE_IDS.includes(z.id),
  );
  const labCritical = labZones.some((z) => z.status === "critical");
  const labWatch = labZones.filter((z) => z.status !== "good");

  const openDeviations = LAKEVIEW_OPEN_DEVIATIONS.filter(
    (d) => d.status === "open",
  );
  const investigatingDeviations = LAKEVIEW_OPEN_DEVIATIONS.filter(
    (d) => d.status === "investigating",
  );

  const missingDocs = LAKEVIEW_DOC_CADENCE.filter(
    (d) => d.todayStatus === "missing",
  );
  const draftDocs = LAKEVIEW_DOC_CADENCE.filter(
    (d) => d.todayStatus === "draft",
  );

  return [
    {
      id: "cmp-pb-ferm-log-gap",
      title: "Fermentation Log Gap",
      rule: 'labSampleOverdue OR fermentationZoneStatus != "good"',
      status:
        labWatch.length === 0
          ? "clear"
          : labCritical
            ? "flagged"
            : "watch",
      count: labWatch.length,
    },
    {
      id: "cmp-pb-deviation-overdue",
      title: "Deviation Overdue",
      rule: 'deviationStatus = "open" AND ownerActionPastDue',
      status:
        openDeviations.length > 0
          ? "flagged"
          : investigatingDeviations.length > 0
            ? "watch"
            : "clear",
      count: openDeviations.length + investigatingDeviations.length,
    },
    {
      id: "cmp-pb-missing-daily-doc",
      title: "Missing Daily Doc",
      rule: 'requiredDailyDoc.todayStatus = "missing"',
      status:
        missingDocs.length > 0
          ? "flagged"
          : draftDocs.length > 0
            ? "watch"
            : "clear",
      count: missingDocs.length,
    },
  ];
}
