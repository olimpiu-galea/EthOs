/** Demo fixture — Lakeview Ethanol procurement playbooks (POC list, edited on /playbooks) */

import type { ProcurementItem } from "./procurement-fixture";
import {
  itemsBelowMinimum,
  nearMinimumStock,
  stockoutBeforeLeadTime,
} from "./procurement-fixture";

export type ProcurementPlaybookSeverity = "Warning" | "Medium" | "Critical";

export type ProcurementAgendaField = {
  label: string;
  value: string;
};

export type ProcurementPlaybook = {
  id: string;
  name: string;
  description: string;
  /** Agenda alert type/category */
  type: "Procurement";
  severity: ProcurementPlaybookSeverity;
  /** Marks the newly added POC playbook */
  isNew?: boolean;
  /** Placeholder-based agenda alert templates (rendered with item data) */
  titleTemplate?: string;
  bodyTemplate?: string;
  agendaFields?: ProcurementAgendaField[];
  /** Live match count against the procurement fixture (POC) */
  match?: (items: ProcurementItem[]) => ProcurementItem[];
};

export const NEAR_MINIMUM_PLAYBOOK_ID = "proc-pb-near-minimum-5pct";

export const PROCUREMENT_PLAYBOOKS: ProcurementPlaybook[] = [
  {
    id: "proc-pb-minimum-stock-risk",
    name: "Minimum Stock Risk",
    description: "Current stock has reached or dropped below the configured minimum.",
    type: "Procurement",
    severity: "Warning",
  },
  {
    id: "proc-pb-stockout-before-lead",
    name: "Stockout Before Lead Time",
    description: "Forecast days of cover is shorter than the supplier lead time.",
    type: "Procurement",
    severity: "Critical",
  },
  {
    id: "proc-pb-critical-below-safety",
    name: "Critical Material Below Safety Stock",
    description: "A critical-risk material has fallen below its safety threshold.",
    type: "Procurement",
    severity: "Critical",
  },
  {
    id: "proc-pb-open-po-followup",
    name: "Open Purchase Order Follow-up",
    description: "Open purchase orders need follow-up on approval, shipping, or receipt.",
    type: "Procurement",
    severity: "Medium",
  },
  {
    id: "proc-pb-supplier-lead-risk",
    name: "Supplier Lead Time Risk",
    description: "Long supplier lead time (>= 14 days) with cover shorter than replenishment.",
    type: "Procurement",
    severity: "Warning",
  },
  {
    id: "proc-pb-consumption-spike",
    name: "High Consumption Rate Spike",
    description: "Recent consumption rate is materially above the planned baseline.",
    type: "Procurement",
    severity: "Warning",
  },
  {
    id: "proc-pb-required-missing",
    name: "Required Material Missing for Planned Production",
    description: "A material required by an upcoming required-by date is not yet covered.",
    type: "Procurement",
    severity: "Critical",
  },
  {
    id: "proc-pb-cost-increase-review",
    name: "Procurement Cost Increase Review",
    description: "Last purchase price increased and warrants a sourcing/cost review.",
    type: "Procurement",
    severity: "Medium",
  },
  {
    id: NEAR_MINIMUM_PLAYBOOK_ID,
    name: "5% Near Minimum Stock",
    description:
      "Early warning when current stock is within 5% above the configured minimum but has not yet dropped below it.",
    type: "Procurement",
    severity: "Warning",
    isNew: true,
    titleTemplate: "{itemName} is within 5% of minimum stock",
    bodyTemplate:
      "{itemName} currently has {currentStock} {unitOfMeasure} available. The configured minimum stock is {minimumStock} {unitOfMeasure}. This item is within 5% of the minimum threshold and may require procurement review. Recommended action: {recommendedAction}.",
    agendaFields: [
      { label: "Type", value: "Procurement" },
      { label: "Severity", value: "Warning" },
      { label: "Item ID", value: "{itemId}" },
      { label: "Item name", value: "{itemName}" },
      { label: "Area", value: "{area}" },
      { label: "Current stock", value: "{currentStock}" },
      { label: "Minimum stock", value: "{minimumStock}" },
      { label: "Unit", value: "{unitOfMeasure}" },
      { label: "Recommended action", value: "{recommendedAction}" },
      { label: "Owner", value: "{owner}" },
    ],
    match: nearMinimumStock,
  },
];

export type ProcurementWatchStatus = "clear" | "watch" | "flagged";

export type ProcurementWatchItem = {
  /** Links back to the playbook on /playbooks */
  id: string;
  /** Min title (playbook name) */
  name: string;
  /** Min rule (concise trigger condition) */
  rule: string;
  status: ProcurementWatchStatus;
  count: number;
};

/**
 * Top-3 procurement playbook watch items (batches-style panel).
 * The "5% Near Minimum Stock" playbook is always listed first.
 */
export function procurementWatchItems(
  items: ProcurementItem[],
): ProcurementWatchItem[] {
  const near = nearMinimumStock(items);
  const below = itemsBelowMinimum(items);
  const stockout = stockoutBeforeLeadTime(items);

  return [
    {
      id: NEAR_MINIMUM_PLAYBOOK_ID,
      name: "5% Near Minimum Stock",
      rule: "Stock within 5% above minimum",
      status: near.length > 0 ? "watch" : "clear",
      count: near.length,
    },
    {
      id: "proc-pb-minimum-stock-risk",
      name: "Minimum Stock Risk",
      rule: "Current stock at or below minimum",
      status: below.length > 0 ? "flagged" : "clear",
      count: below.length,
    },
    {
      id: "proc-pb-stockout-before-lead",
      name: "Stockout Before Lead Time",
      rule: "Days of cover below supplier lead time",
      status: stockout.length > 0 ? "watch" : "clear",
      count: stockout.length,
    },
  ];
}

/** Replace {placeholders} in a playbook template with concrete item values */
export function renderProcurementAlert(
  template: string,
  item: ProcurementItem,
): string {
  const values: Record<string, string> = {
    itemId: item.itemId,
    itemName: item.itemName,
    area: item.area,
    currentStock: String(item.currentStock),
    minimumStock: String(item.minimumStock),
    unitOfMeasure: item.unitOfMeasure,
    recommendedAction: item.recommendedAction,
    owner: item.owner,
  };

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}
