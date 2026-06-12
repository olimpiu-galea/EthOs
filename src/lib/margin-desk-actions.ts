import { numericValue } from "@/lib/dcs-parser";
import {
  buildCommoditySnapshot,
  findCommodityTag,
  marketSignalLabel,
  prefillFinancialReportFields,
} from "@/lib/commodity-signals";
import { FINANCIAL_ACTION_ITEMS, FINANCIAL_GUIDANCE } from "@/lib/default-playbook-response";
import { defaultReportTitle } from "@/lib/report-templates";
import type {
  AlertAgendaItem,
  AuthUser,
  DcsTagWithKey,
  MarginDecision,
  MarginDecisionType,
  UserRole,
} from "@/lib/types";
import { ALERT_DURATION_MS } from "@/lib/types";
import { useSettingsStore } from "@/stores/settings-store";
import { financeTeamId } from "@/lib/teams";

function marginDeskTeamId(): string | undefined {
  return financeTeamId(useSettingsStore.getState().teams);
}

export const MARGIN_THRESHOLD = {
  marginPerGalBelow: 0.12,
  inventoryDaysAbove: 12,
} as const;

const MARGIN_THRESHOLD_ALERT_ID = "margin-desk-threshold";

export function marginSnapshotFromTags(tags: DcsTagWithKey[]) {
  const margin = numericValue(
    findCommodityTag(tags, "MKT-MARGIN/_.PerGal")?.value ?? 0,
  );
  const surplusGal = numericValue(
    findCommodityTag(tags, "MKT-SURPLUS/_.Gal")?.value ?? 0,
  );
  const contractCoveragePct = numericValue(
    findCommodityTag(tags, "MKT-CONTRACT/_.Coverage")?.value ?? 0,
  );
  const inventoryDays = numericValue(
    findCommodityTag(tags, "MKT-INVENTORY/_.Days")?.value ?? 0,
  );
  const marketVal = numericValue(
    findCommodityTag(tags, "MKT-MARKET/_.Signal")?.value ?? 0,
  );
  const hedgeActive =
    numericValue(findCommodityTag(tags, "MKT-HEDGE/_.Rec")?.value ?? 0) === 1;

  return {
    marginPerGal: margin,
    surplusGal,
    contractCoveragePct,
    inventoryDays,
    marketSignal: marketSignalLabel(marketVal),
    hedgeActive,
  };
}

export function marginThresholdBreached(
  snapshot: ReturnType<typeof marginSnapshotFromTags>,
): boolean {
  return (
    snapshot.marginPerGal < MARGIN_THRESHOLD.marginPerGalBelow &&
    snapshot.inventoryDays > MARGIN_THRESHOLD.inventoryDaysAbove
  );
}

export function routedRolesForDecision(
  type: MarginDecisionType,
): UserRole[] {
  if (type === "hedge") {
    return ["financial", "procurement", "supervisor"];
  }
  return ["procurement", "financial", "supervisor"];
}

export function primaryAssigneeForDecision(
  type: MarginDecisionType,
): UserRole {
  return type === "hedge" ? "financial" : "procurement";
}

export function decisionLabel(type: MarginDecisionType): string {
  const map: Record<MarginDecisionType, string> = {
    sell: "Sell spot / loadout",
    hold: "Hold inventory",
    hedge: "Hedge position",
  };
  return map[type];
}

export function buildMarginAssignmentAlert(
  decision: MarginDecision,
): Omit<AlertAgendaItem, "id"> {
  const loadoutLine =
    decision.type === "sell"
      ? decision.loadoutApproved
        ? "Spot loadout APPROVED by supervisor."
        : "Spot loadout pending approval."
      : null;

  return {
    playbookId: "margin-desk-decision",
    playbookName: "Margin desk decision",
    alertTitle: `${decisionLabel(decision.type)} — action required`,
    alertMessage: [
      `${decision.actor} (${decision.actorRole}) recorded ${decision.type.toUpperCase()} on Margin Desk.`,
      loadoutLine,
      decision.note ? `Note: ${decision.note}` : null,
      `Margin $${decision.snapshot.marginPerGal.toFixed(2)}/gal · Surplus ${decision.snapshot.surplusGal.toLocaleString()} gal · Signal ${decision.snapshot.marketSignal}.`,
    ]
      .filter(Boolean)
      .join(" "),
    severity: decision.type === "sell" ? "warning" : "info",
    triggeredAt: decision.at,
    durationMs: ALERT_DURATION_MS,
    status: "active",
    lifecycle: "new",
    conditionsSummary: `Margin desk · ${decision.type}`,
    actionItems: FINANCIAL_ACTION_ITEMS,
    guidance: FINANCIAL_GUIDANCE,
    completedActionIds: [],
    routedRoles: routedRolesForDecision(decision.type),
    assignedRole: primaryAssigneeForDecision(decision.type),
    escalationLevel: 0,
    teamId: marginDeskTeamId(),
  };
}

export function buildMarginThresholdAlert(
  snapshot: ReturnType<typeof marginSnapshotFromTags>,
  now = Date.now(),
): Omit<AlertAgendaItem, "id"> {
  return {
    playbookId: "margin-desk-threshold",
    playbookName: "Margin desk threshold",
    alertTitle: "Low margin + high inventory",
    alertMessage: `Margin $${snapshot.marginPerGal.toFixed(2)}/gal is below $${MARGIN_THRESHOLD.marginPerGalBelow.toFixed(2)} while inventory days supply is ${snapshot.inventoryDays.toFixed(1)}d (policy > ${MARGIN_THRESHOLD.inventoryDaysAbove}d). Review sell/hold on Margin Desk.`,
    severity: "warning",
    triggeredAt: now,
    durationMs: ALERT_DURATION_MS,
    status: "active",
    lifecycle: "new",
    conditionsSummary: `margin < ${MARGIN_THRESHOLD.marginPerGalBelow} AND inventory > ${MARGIN_THRESHOLD.inventoryDaysAbove}d`,
    actionItems: FINANCIAL_ACTION_ITEMS,
    guidance: FINANCIAL_GUIDANCE,
    completedActionIds: [],
    routedRoles: ["procurement", "financial", "supervisor"],
    assignedRole: "financial",
    escalationLevel: 0,
    teamId: marginDeskTeamId(),
  };
}

export function buildFmrFromMarginDesk(
  tags: DcsTagWithKey[],
  user: Pick<AuthUser, "name" | "role">,
  decision?: Pick<MarginDecision, "type" | "note" | "loadoutApproved">,
) {
  const snapshot = marginSnapshotFromTags(tags);
  const prefill = prefillFinancialReportFields(tags);
  const decisionLine = decision
    ? `Desk decision: ${decision.type.toUpperCase()}${decision.loadoutApproved ? " · loadout approved" : ""}${decision.note ? ` — ${decision.note}` : ""}`
    : null;

  return {
    templateId: "financial" as const,
    title: defaultReportTitle("financial"),
    createdBy: user.name,
    author: user.name,
    authorRole: user.role,
    fields: {
      ...prefill,
      author: user.name,
      approvedBy: user.role === "supervisor" ? user.name : "",
      recommendation: [prefill.recommendation, decisionLine]
        .filter(Boolean)
        .join("\n\n"),
    },
    linkedAlerts: [],
    commoditySnapshot: buildCommoditySnapshot(tags),
  };
}

export function createMarginDecision(
  type: MarginDecisionType,
  user: Pick<AuthUser, "name" | "role">,
  tags: DcsTagWithKey[],
  opts: { note?: string; loadoutApproved?: boolean } = {},
): MarginDecision {
  const id = crypto.randomUUID();
  return {
    id,
    type,
    actor: user.name,
    actorRole: user.role,
    note: opts.note?.trim() || undefined,
    loadoutApproved: type === "sell" ? Boolean(opts.loadoutApproved) : false,
    routedTo: routedRolesForDecision(type).filter(
      (r) => r !== "supervisor",
    ),
    at: Date.now(),
    snapshot: marginSnapshotFromTags(tags),
  };
}

export { MARGIN_THRESHOLD_ALERT_ID };
