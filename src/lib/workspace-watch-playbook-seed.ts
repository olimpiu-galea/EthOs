import type { Playbook, PlaybookActionItem, PlaybookGuidanceStep } from "./types";
import {
  LAKEVIEW_TEAM_COMPLIANCE,
  LAKEVIEW_TEAM_MAINTENANCE,
  LAKEVIEW_TEAM_PROCUREMENT,
} from "./lakeview-demo-seed";
import {
  COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
  COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID,
  COMPLIANCE_PLAYBOOKS,
} from "./compliance-playbooks";
import {
  MAINTENANCE_DUE_SOON_PLAYBOOK_ID,
  MAINTENANCE_PLAYBOOKS,
} from "./maintenance-playbooks";
import {
  NEAR_MINIMUM_PLAYBOOK_ID,
  PROCUREMENT_PLAYBOOKS,
} from "./procurement-playbooks";
import type { OpsTeam } from "./teams";
import { routedRolesForTeam } from "./teams";
import type { AuthUser } from "./types";

export const MINIMUM_STOCK_PLAYBOOK_ID = "proc-pb-minimum-stock-risk";
export const CRITICAL_OVERDUE_PLAYBOOK_ID = "mnt-pb-critical-overdue";

const WATCH_BUILTIN_IDS = [
  NEAR_MINIMUM_PLAYBOOK_ID,
  MINIMUM_STOCK_PLAYBOOK_ID,
  MAINTENANCE_DUE_SOON_PLAYBOOK_ID,
  CRITICAL_OVERDUE_PLAYBOOK_ID,
  COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID,
  COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
] as const;

function warningAlert(title: string, message: string): Playbook["alert"] {
  return {
    type: "predefined",
    predefinedId: "warning",
    title,
    message,
    severity: "warning",
  };
}

function criticalAlert(title: string, message: string): Playbook["alert"] {
  return {
    type: "predefined",
    predefinedId: "critical",
    title,
    message,
    severity: "critical",
  };
}

function teamMeta(teamId: string, teams: OpsTeam[], users: AuthUser[]) {
  return {
    teamId,
    teamIds: [teamId],
    routedRoles: routedRolesForTeam(teamId, teams, users),
  };
}

function nearMinimumProcurementPlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = PROCUREMENT_PLAYBOOKS.find((p) => p.id === NEAR_MINIMUM_PLAYBOOK_ID);
  const actionItems: PlaybookActionItem[] = [
    {
      id: "check-stock",
      title: "Confirm stock within 5% of minimum",
      detail: "Open Procurement and verify on-hand vs reorder point.",
    },
    {
      id: "review-po",
      title: "Review open purchase orders",
      detail: "Expedite supplier if cover is tightening.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Procurement workspace",
      body: "Use the buying desk for PO and supplier context.",
    },
    {
      title: "Resolve when done",
      body: "Log the procurement action and close the alert.",
    },
  ];

  return {
    name: fixture?.name ?? "5% Near Minimum Stock",
    description:
      fixture?.description ??
      "Early warning when current stock is within 5% above the configured minimum.",
    status: "disabled",
    builtinId: NEAR_MINIMUM_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: warningAlert(
      "{itemName} is within 5% of minimum stock",
      "Current stock is within 5% above the configured minimum threshold.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_PROCUREMENT, teams, users),
  };
}

function minimumStockProcurementPlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = PROCUREMENT_PLAYBOOKS.find((p) => p.id === MINIMUM_STOCK_PLAYBOOK_ID);
  const actionItems: PlaybookActionItem[] = [
    {
      id: "confirm-minimum",
      title: "Confirm stock at or below minimum",
      detail: "Validate on-hand quantity against the configured minimum.",
    },
    {
      id: "raise-po",
      title: "Raise or expedite purchase order",
      detail: "Create or expedite a PO before production impact.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Minimum stock breach",
      body: "Treat as a replenishment priority for the material owner.",
    },
    {
      title: "Resolve when done",
      body: "Close the alert after PO action is logged.",
    },
  ];

  return {
    name: fixture?.name ?? "Minimum Stock Risk",
    description:
      fixture?.description ??
      "Current stock has reached or dropped below the configured minimum.",
    status: "disabled",
    builtinId: MINIMUM_STOCK_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: warningAlert(
      "{itemName} is at or below minimum stock",
      "Current stock has reached or dropped below the configured minimum.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_PROCUREMENT, teams, users),
  };
}

function maintenanceDueSoonPlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = MAINTENANCE_PLAYBOOKS.find((p) => p.id === MAINTENANCE_DUE_SOON_PLAYBOOK_ID);
  const actionItems: PlaybookActionItem[] = [
    {
      id: "review-due-date",
      title: "Review due maintenance item",
      detail: "Confirm owner, parts, and schedule for the upcoming due date.",
    },
    {
      id: "prepare-parts",
      title: "Prepare required parts",
      detail: "Verify spare parts are available before the due window closes.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Maintenance workspace",
      body: "Use the maintenance hub to review asset and work-order context.",
    },
    {
      title: "Resolve when done",
      body: "Close the alert after the work is scheduled or completed.",
    },
  ];

  return {
    name: fixture?.name ?? "Maintenance Due Soon",
    description:
      "Alerts when a maintenance item is due within the next 7 days and is not compliant.",
    status: "disabled",
    builtinId: MAINTENANCE_DUE_SOON_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: warningAlert(
      "{itemName} is due on {dueDate}",
      "A maintenance item is due within the next 7 days.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_MAINTENANCE, teams, users),
  };
}

function criticalOverdueMaintenancePlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = MAINTENANCE_PLAYBOOKS.find((p) => p.id === CRITICAL_OVERDUE_PLAYBOOK_ID);
  const actionItems: PlaybookActionItem[] = [
    {
      id: "escalate-overdue",
      title: "Escalate overdue critical asset work",
      detail: "Assign priority owner and confirm mitigation plan.",
    },
    {
      id: "schedule-repair",
      title: "Schedule immediate repair window",
      detail: "Coordinate downtime with operations for the critical asset.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Critical overdue work",
      body: "Treat overdue critical assets as a production risk.",
    },
    {
      title: "Resolve when done",
      body: "Close the alert after repair is scheduled or completed.",
    },
  ];

  return {
    name: fixture?.name ?? "Critical Asset Overdue",
    description:
      "Alerts when a critical asset maintenance item is overdue.",
    status: "disabled",
    builtinId: CRITICAL_OVERDUE_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: criticalAlert(
      "{itemName} is overdue for critical asset {assetName}",
      "A critical asset maintenance item is overdue.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_MAINTENANCE, teams, users),
  };
}

function fermLogGapCompliancePlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = COMPLIANCE_PLAYBOOKS.find(
    (p) => p.id === COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID,
  );
  const actionItems: PlaybookActionItem[] = [
    {
      id: "review-ferm-log",
      title: "Review fermentation log gap",
      detail: "Confirm lab samples and zone status for active fermentation batches.",
    },
    {
      id: "post-sample",
      title: "Post overdue lab sample",
      detail: "Release pending checkpoint rows before end of shift.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Compliance workspace",
      body: "Use plant posture and deviation register for batch context.",
    },
    {
      title: "Resolve when done",
      body: "Close the alert after the log gap is documented and mitigated.",
    },
  ];

  return {
    name: fixture?.name ?? "Fermentation Log Gap",
    description:
      "Alerts when lab samples are overdue or fermentation QA zones are not on track.",
    status: "disabled",
    builtinId: COMPLIANCE_FERM_LOG_GAP_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: warningAlert(
      "Fermentation log gap on batch {batchId}",
      "A lab sample is overdue or fermentation QA status requires review.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_COMPLIANCE, teams, users),
  };
}

function deviationOverdueCompliancePlaybook(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id"> {
  const fixture = COMPLIANCE_PLAYBOOKS.find(
    (p) => p.id === COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
  );
  const actionItems: PlaybookActionItem[] = [
    {
      id: "assign-owner",
      title: "Assign deviation owner",
      detail: "Confirm accountable owner and due date on the open deviation.",
    },
    {
      id: "escalate-overdue",
      title: "Escalate past-due deviation",
      detail: "Route to supervisor if owner action is past due.",
    },
  ];
  const guidance: PlaybookGuidanceStep[] = [
    {
      title: "Deviation register",
      body: "Review open deviations and linked batch workspaces.",
    },
    {
      title: "Resolve when done",
      body: "Close the alert after owner action is logged.",
    },
  ];

  return {
    name: fixture?.name ?? "Deviation Overdue",
    description: "Alerts when an open deviation is past its owner action due date.",
    status: "disabled",
    builtinId: COMPLIANCE_DEVIATION_OVERDUE_PLAYBOOK_ID,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems,
    guidance,
    alert: criticalAlert(
      "Deviation overdue for batch {batchId}",
      "An open deviation requires owner action past its due date.",
    ),
    ...teamMeta(LAKEVIEW_TEAM_COMPLIANCE, teams, users),
  };
}

export function createWorkspaceWatchPlaybooks(
  teams: OpsTeam[],
  users: AuthUser[],
): Omit<Playbook, "id">[] {
  return [
    nearMinimumProcurementPlaybook(teams, users),
    minimumStockProcurementPlaybook(teams, users),
    maintenanceDueSoonPlaybook(teams, users),
    criticalOverdueMaintenancePlaybook(teams, users),
    fermLogGapCompliancePlaybook(teams, users),
    deviationOverdueCompliancePlaybook(teams, users),
  ];
}

function ensureInactiveBuiltinPlaybook(
  template: Omit<Playbook, "id">,
  existing: Playbook | undefined,
  upsert: (id: string, patch: Partial<Playbook>) => void,
  add: (playbook: Omit<Playbook, "id">) => void,
): void {
  if (!existing) {
    add(template);
    return;
  }

  upsert(existing.id, {
    name: template.name,
    description: template.description,
    conditions: template.conditions,
    matchMode: template.matchMode,
    conditionGroups: template.conditionGroups,
    groupMatchMode: template.groupMatchMode,
    actionItems: template.actionItems,
    guidance: template.guidance,
    alert: template.alert,
    status: "disabled",
    teamId: template.teamId ?? existing.teamId,
    teamIds: template.teamIds ?? existing.teamIds,
    routedRoles: template.routedRoles ?? existing.routedRoles,
  });
}

export function isWorkspaceWatchBuiltinId(builtinId: string | undefined): boolean {
  return (
    builtinId != null &&
    (WATCH_BUILTIN_IDS as readonly string[]).includes(builtinId)
  );
}

export async function ensureWorkspaceWatchPlaybooks(
  teams: OpsTeam[],
  users: AuthUser[],
): Promise<void> {
  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const store = usePlaybookStore.getState();
  const templates = createWorkspaceWatchPlaybooks(teams, users);

  for (const template of templates) {
    const existing = store.playbooks.find(
      (p) => p.builtinId === template.builtinId,
    );
    ensureInactiveBuiltinPlaybook(
      template,
      existing,
      store.updatePlaybook.bind(store),
      store.addPlaybook.bind(store),
    );
  }
}
