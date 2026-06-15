import type { Playbook, PlaybookActionItem, PlaybookGuidanceStep } from "./types";
import { criticalPlaybookAlert } from "./types";
import type { OpsTeam } from "./teams";
import { routedRolesForTeam } from "./teams";
import { DEFAULT_COMPANY } from "./auth-constants";
import type { AuthUser } from "./types";

export type LakeviewWorkspaceId =
  | "procurement"
  | "maintenance"
  | "financial"
  | "compliance";

export type LakeviewWorkspaceDemo = {
  workspaceId: LakeviewWorkspaceId;
  userId: string;
  teamId: string;
  teamName: string;
  teamDescription: string;
  builtinId: string;
  playbookName: string;
  playbookDescription: string;
  triggerHour: number;
  triggerMinute: number;
  alertTitle: string;
  alertMessage: string;
  conditionsSummary: string;
  severity: "info" | "warning" | "critical";
  actionItems: PlaybookActionItem[];
  guidance: PlaybookGuidanceStep[];
  batchContext?: import("./potential-temp-alerts-adapter").MappedPotentialTempAlert["batchContext"];
};

export const LAKEVIEW_TEAM_OPERATIONAL = "lakeview-team-operational";
export const LAKEVIEW_TEAM_PROCUREMENT = "lakeview-team-procurement";
export const LAKEVIEW_TEAM_MAINTENANCE = "lakeview-team-maintenance";
export const LAKEVIEW_TEAM_FINANCIAL = "lakeview-team-financial";
export const LAKEVIEW_TEAM_COMPLIANCE = "lakeview-team-compliance";

const LAKEVIEW_OPERATIONAL_TEAM: OpsTeam = {
  id: LAKEVIEW_TEAM_OPERATIONAL,
  name: "Operations",
  description: "Fermenter batches, DCS signals, and shift handover",
  enabled: true,
  memberUserIds: ["operational"],
};

const PROCUREMENT_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "check-stock",
    title: "Confirm alpha amylase below minimum",
    detail: "Open Procurement · buying desk and verify on-hand vs reorder point.",
  },
  {
    id: "expedite-po",
    title: "Expedite open PO",
    detail: "Contact supplier on PO-2026-0142; confirm ETA before next cook.",
  },
  {
    id: "approve-alt",
    title: "Approve alternate vendor if needed",
    detail: "Use approved substitute list if primary lead time exceeds 5 days.",
  },
  {
    id: "log-procurement",
    title: "Log decision and resolve",
    detail: "Note PO action in buying desk and close alert.",
  },
];

const MAINTENANCE_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "verify-spare",
    title: "Verify spare part stock",
    detail: "SP-PUMP-SEAL-044 is below min for WO-4418 in Maintenance workspace.",
  },
  {
    id: "issue-requisition",
    title: "Issue stock requisition",
    detail: "Create requisition from spare-parts tab; tie to asset P-102.",
  },
  {
    id: "schedule-install",
    title: "Schedule install window",
    detail: "Coordinate with operations for 4h downtime on Ferm B transfer pump.",
  },
  {
    id: "close-wo",
    title: "Update WO and resolve",
    detail: "Mark parts on order; resolve when ETA is confirmed.",
  },
];

const FINANCIAL_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-margin",
    title: "Review margin vs plan",
    detail: "Financial workspace shows ethanol margin below weekly target.",
  },
  {
    id: "inventory-days",
    title: "Check inventory days on hand",
    detail: "Corn and ethanol inventory days are elevated — model carry cost.",
  },
  {
    id: "recommend-action",
    title: "Recommend hedge or run-rate change",
    detail: "Document option in margin desk decision log.",
  },
  {
    id: "log-financial",
    title: "Log decision and resolve",
    detail: "Record recommendation and resolve after supervisor review.",
  },
];

const COMPLIANCE_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "open-deviation",
    title: "Open deviation record",
    detail: "Fermentation log gap on batch 6418 — start deviation in Compliance.",
  },
  {
    id: "gather-evidence",
    title: "Gather batch evidence",
    detail: "Pull lab sheet, DCS trend, and operator notes for the gap window.",
  },
  {
    id: "qa-assessment",
    title: "Complete QA assessment",
    detail: "Classify impact; assign corrective action owner.",
  },
  {
    id: "close-compliance",
    title: "Route for approval and resolve",
    detail: "Submit for plant QA sign-off; resolve when documented.",
  },
];

export const LAKEVIEW_WORKSPACE_DEMOS: LakeviewWorkspaceDemo[] = [
  {
    workspaceId: "procurement",
    userId: "procurement",
    teamId: LAKEVIEW_TEAM_PROCUREMENT,
    teamName: "Procurement",
    teamDescription: "Buying desk, PO expediting, and supplier lead times",
    builtinId: "workspace-daily-procurement",
    playbookName: "Procurement daily checkpoint",
    playbookDescription:
      "Daily procurement alert for demos — enzyme stock below minimum, tied to the Procurement team on Agenda.",
    triggerHour: 8,
    triggerMinute: 0,
    alertTitle: "Procurement checkpoint",
    alertMessage:
      "Alpha amylase is below minimum stock. Expedite PO-2026-0142 or approve an alternate before the next cook.",
    conditionsSummary: "Procurement demo · one instance per day on the Agenda",
    severity: "warning",
    actionItems: PROCUREMENT_ACTION_ITEMS,
    guidance: [
      {
        title: "Procurement workspace",
        body: "Open Procurement · buying desk for PO and supplier context.",
      },
      {
        title: "Buying vs maintenance",
        body: "This alert is about purchased materials — spare parts live under Maintenance.",
      },
      {
        title: "Resolve when done",
        body: "Log the PO action and resolve; new instance next day.",
      },
    ],
  },
  {
    workspaceId: "maintenance",
    userId: "maintenance",
    teamId: LAKEVIEW_TEAM_MAINTENANCE,
    teamName: "Maintenance",
    teamDescription: "Spare parts, work orders, and asset reliability",
    builtinId: "workspace-daily-maintenance",
    playbookName: "Maintenance daily checkpoint",
    playbookDescription:
      "Daily maintenance alert for demos — spare part below minimum for an open WO, tied to the Maintenance team.",
    triggerHour: 9,
    triggerMinute: 0,
    alertTitle: "Maintenance checkpoint",
    alertMessage:
      "SP-PUMP-SEAL-044 is below minimum for WO-4418 on pump P-102. Issue requisition and confirm install window.",
    conditionsSummary: "Maintenance demo · one instance per day on the Agenda",
    severity: "warning",
    actionItems: MAINTENANCE_ACTION_ITEMS,
    guidance: [
      {
        title: "Maintenance workspace",
        body: "Use spare-parts inventory and asset registry tabs for context.",
      },
      {
        title: "Tie to asset",
        body: "Link requisition to asset P-102 and the open work order.",
      },
      {
        title: "Resolve when done",
        body: "Resolve when parts are on order with a confirmed ETA.",
      },
    ],
  },
  {
    workspaceId: "financial",
    userId: "financial",
    teamId: LAKEVIEW_TEAM_FINANCIAL,
    teamName: "Financial",
    teamDescription: "Margin desk, inventory carry, and commodity exposure",
    builtinId: "workspace-daily-financial",
    playbookName: "Financial daily checkpoint",
    playbookDescription:
      "Daily financial alert for demos — margin below target with high inventory days, tied to the Financial team.",
    triggerHour: 10,
    triggerMinute: 0,
    alertTitle: "Financial checkpoint",
    alertMessage:
      "Ethanol margin is below the weekly plan while corn and ethanol inventory days are elevated. Review hedge and run-rate options.",
    conditionsSummary: "Financial demo · one instance per day on the Agenda",
    severity: "info",
    actionItems: FINANCIAL_ACTION_ITEMS,
    guidance: [
      {
        title: "Financial workspace",
        body: "Use margin desk charts and inventory days for the full picture.",
      },
      {
        title: "Document decision",
        body: "Record the recommended action in the margin decision log.",
      },
      {
        title: "Resolve when done",
        body: "Resolve after supervisor review is noted.",
      },
    ],
  },
  {
    workspaceId: "compliance",
    userId: "compliance",
    teamId: LAKEVIEW_TEAM_COMPLIANCE,
    teamName: "Compliance",
    teamDescription: "Plant QA, deviations, and fermentation documentation",
    builtinId: "workspace-daily-compliance",
    playbookName: "Compliance daily checkpoint",
    playbookDescription:
      "Daily compliance alert for demos — fermentation log gap on batch 6418, tied to the Compliance team.",
    triggerHour: 11,
    triggerMinute: 0,
    alertTitle: "Compliance checkpoint",
    alertMessage:
      "Fermentation log gap detected on batch 6418. Open a deviation, gather evidence, and route for plant QA sign-off.",
    conditionsSummary: "Compliance demo · one instance per day on the Agenda",
    severity: "critical",
    actionItems: COMPLIANCE_ACTION_ITEMS,
    guidance: [
      {
        title: "Compliance workspace",
        body: "Use the deviation register and fermentation doc checklist.",
      },
      {
        title: "Evidence bundle",
        body: "Attach lab sheet, DCS trend, and operator notes to the deviation.",
      },
      {
        title: "Resolve when done",
        body: "Resolve when QA assessment is documented.",
      },
    ],
    batchContext: {
      batchId: "6418",
      fermenter: "B",
      phaseId: "ferm",
      phaseLabel: "Fermentation",
      batchAgeH: 20,
      projectedYield: "15.1% projected",
      labSamples: [
        { label: "Log gap", value: "2h window missing" },
        { label: "Batch", value: "6418 · Ferm B" },
        { label: "Status", value: "Deviation required" },
      ],
    },
  },
];

const WORKSPACE_DEMO_BY_BUILTIN = new Map(
  LAKEVIEW_WORKSPACE_DEMOS.map((d) => [d.builtinId, d]),
);

export function workspaceDemoByBuiltinId(
  builtinId: string,
): LakeviewWorkspaceDemo | undefined {
  return WORKSPACE_DEMO_BY_BUILTIN.get(builtinId);
}

export function isWorkspaceDailyBuiltinId(builtinId: string | undefined): boolean {
  return builtinId != null && LAKEVIEW_WORKSPACE_DEMOS.some((d) => d.builtinId === builtinId);
}

export function buildLakeviewDemoTeams(): OpsTeam[] {
  const fromDemos = LAKEVIEW_WORKSPACE_DEMOS.map((d) => ({
    id: d.teamId,
    name: d.teamName,
    description: d.teamDescription,
    enabled: true,
    memberUserIds: [d.userId],
  }));
  const byId = new Map<string, OpsTeam>([
    [LAKEVIEW_OPERATIONAL_TEAM.id, { ...LAKEVIEW_OPERATIONAL_TEAM }],
  ]);
  for (const team of fromDemos) {
    byId.set(team.id, team);
  }
  return Array.from(byId.values());
}

export function mergeLakeviewDemoTeams(existing: OpsTeam[]): OpsTeam[] {
  const seed = buildLakeviewDemoTeams();
  const byId = new Map(existing.map((t) => [t.id, t]));

  for (const team of seed) {
    const current = byId.get(team.id);
    if (current) {
      byId.set(team.id, {
        ...current,
        name: team.name,
        description: team.description,
        enabled: current.enabled ?? true,
        memberUserIds: team.memberUserIds,
      });
    } else {
      byId.set(team.id, team);
    }
  }

  return Array.from(byId.values());
}

export function createWorkspaceDailyPlaybook(
  demo: LakeviewWorkspaceDemo,
  users: AuthUser[],
  teams: OpsTeam[],
): Omit<Playbook, "id"> {
  const teamMeta = {
    teamId: demo.teamId,
    teamIds: [demo.teamId],
    routedRoles: routedRolesForTeam(demo.teamId, teams, users),
  };

  return {
    name: demo.playbookName,
    description: demo.playbookDescription,
    status: "active",
    builtinId: demo.builtinId,
    conditions: [],
    matchMode: "all",
    conditionGroups: [],
    groupMatchMode: "all",
    actionItems: demo.actionItems.map((a) => ({ ...a })),
    guidance: demo.guidance.map((g) => ({ ...g })),
    alert:
      demo.severity === "critical"
        ? criticalPlaybookAlert(demo.alertMessage)
        : {
            type: "predefined",
            predefinedId: demo.severity === "warning" ? "warning" : "info",
            title: demo.alertTitle,
            message: demo.alertMessage,
            severity: demo.severity,
          },
    ...teamMeta,
  };
}

/** Seed Lakeview demo teams into settings when missing */
export async function ensureLakeviewDemoSeed(): Promise<void> {
  const { useSettingsStore } = await import("@/stores/settings-store");
  const settings = useSettingsStore.getState();
  if (settings.companyId !== DEFAULT_COMPANY.id) return;

  const existing =
    settings.teamsByCompany[DEFAULT_COMPANY.id] ?? settings.teams ?? [];
  const next = mergeLakeviewDemoTeams(existing);

  useSettingsStore.setState((s) => ({
    teams: s.companyId === DEFAULT_COMPANY.id ? next : s.teams,
    teamsByCompany: {
      ...s.teamsByCompany,
      [DEFAULT_COMPANY.id]: next,
    },
  }));
}
