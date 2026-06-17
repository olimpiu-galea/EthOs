/** Demo fixture — Lakeview Ethanol maintenance playbooks (POC list, edited on /playbooks) */

import type { MaintenanceAction } from "./maintenance-actions-fixture";
import {
  criticalOverdueActions,
  dueThisWeekActions,
  partsBlockingActions,
} from "./maintenance-actions-fixture";

export type MaintenancePlaybookSeverity = "Warning" | "Medium" | "Critical";

export type MaintenanceAgendaField = {
  label: string;
  value: string;
};

export type MaintenancePlaybook = {
  id: string;
  name: string;
  /** Placeholder-based agenda alert title */
  titleTemplate: string;
  /** Min rule (trigger condition) shown in the watch panel */
  rule: string;
  type: "Maintenance";
  severity: MaintenancePlaybookSeverity;
  isNew?: boolean;
  bodyTemplate?: string;
  agendaFields?: MaintenanceAgendaField[];
  match: (items: MaintenanceAction[]) => MaintenanceAction[];
};

export const MAINTENANCE_DUE_SOON_PLAYBOOK_ID = "mnt-pb-due-soon";

export const MAINTENANCE_PLAYBOOKS: MaintenancePlaybook[] = [
  {
    id: MAINTENANCE_DUE_SOON_PLAYBOOK_ID,
    name: "Maintenance Due Soon",
    titleTemplate: "{itemName} is due on {dueDate}",
    rule: 'status != "Compliant" AND dueDate >= today AND dueDate <= today + 7 days',
    type: "Maintenance",
    severity: "Warning",
    isNew: true,
    bodyTemplate:
      "{itemName} for asset {assetName} is due on {dueDate}. The current status is {status}. This item is assigned to {owner}. Recommended action: {recommendedAction}.",
    agendaFields: [
      { label: "Type", value: "Maintenance" },
      { label: "Severity", value: "Warning" },
      { label: "Item ID", value: "{itemId}" },
      { label: "Item name", value: "{itemName}" },
      { label: "Asset ID", value: "{assetId}" },
      { label: "Asset name", value: "{assetName}" },
      { label: "Area", value: "{area}" },
      { label: "Status", value: "{status}" },
      { label: "Due date", value: "{dueDate}" },
      { label: "Owner", value: "{owner}" },
      { label: "Recommended action", value: "{recommendedAction}" },
    ],
    match: dueThisWeekActions,
  },
  {
    id: "mnt-pb-critical-overdue",
    name: "Critical Asset Overdue",
    titleTemplate: "{itemName} is overdue for critical asset {assetName}",
    rule: 'status = "Overdue" AND criticality = "Critical"',
    type: "Maintenance",
    severity: "Critical",
    match: criticalOverdueActions,
  },
  {
    id: "mnt-pb-parts-blocking",
    name: "Parts Blocking Maintenance",
    titleTemplate: "{itemName} is blocked by missing parts",
    rule: 'status != "Compliant" AND requiredPartsAvailable = false',
    type: "Maintenance",
    severity: "Warning",
    match: partsBlockingActions,
  },
];

export type MaintenanceWatchStatus = "clear" | "watch" | "flagged";

export type MaintenanceWatchItem = {
  id: string;
  /** Playbook name shown in the watch panel */
  name: string;
  /** Min rule (trigger condition) */
  rule: string;
  status: MaintenanceWatchStatus;
  count: number;
};

const MAINTENANCE_WATCH_PLAYBOOKS = MAINTENANCE_PLAYBOOKS.filter(
  (pb) =>
    pb.id === MAINTENANCE_DUE_SOON_PLAYBOOK_ID ||
    pb.id === "mnt-pb-critical-overdue",
);

/**
 * Maintenance playbook watch items (batches-style panel).
 * "Maintenance Due Soon" is always listed first.
 */
export function maintenanceWatchItems(
  items: MaintenanceAction[],
): MaintenanceWatchItem[] {
  return MAINTENANCE_WATCH_PLAYBOOKS.map((pb) => {
    const matched = pb.match(items);
    const status: MaintenanceWatchStatus =
      matched.length === 0
        ? "clear"
        : pb.severity === "Critical"
          ? "flagged"
          : "watch";
    return {
      id: pb.id,
      name: pb.name,
      rule: pb.rule,
      status,
      count: matched.length,
    };
  });
}

/** Replace {placeholders} in a playbook template with concrete action values */
export function renderMaintenanceAlert(
  template: string,
  item: MaintenanceAction,
): string {
  const values: Record<string, string> = {
    itemId: item.itemId,
    itemName: item.itemName,
    assetId: item.assetId,
    assetName: item.assetName,
    area: item.area,
    status: item.status,
    dueDate: item.dueDate,
    owner: item.owner,
    recommendedAction: item.recommendedAction,
  };

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}
