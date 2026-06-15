import type { LegacyPlaybook, Playbook, PlaybookAlert, PlaybookCondition } from "./types";
import { PREDEFINED_ALERTS } from "./types";
import { flattenRuleNode } from "./rule-evaluator";
import {
  DEFAULT_ACTION_ITEMS,
  DEFAULT_GUIDANCE,
} from "./default-playbook-response";
import { inferTeamIdFromPlaybook, resolvePlaybookTeamIds } from "./teams";
import { useSettingsStore } from "@/stores/settings-store";

function newConditionId(): string {
  return crypto.randomUUID();
}

/** Legacy playbooks may have type "custom" — map to predefined by severity */
export function normalizePlaybookAlert(
  alert: PlaybookAlert & { type?: string },
): PlaybookAlert {
  const predefinedId =
    alert.type === "predefined" && alert.predefinedId
      ? alert.predefinedId
      : alert.severity === "critical"
        ? "critical"
        : alert.severity === "info"
          ? "info"
          : "warning";
  const preset = PREDEFINED_ALERTS.find((p) => p.id === predefinedId);
  return {
    type: "predefined",
    predefinedId,
    title: preset?.title ?? alert.title,
    message: alert.message,
    severity: preset?.severity ?? alert.severity ?? "warning",
  };
}

function resolveTeamIds(raw: LegacyPlaybook): string[] {
  const teams = useSettingsStore.getState().teams;
  const fromStored = resolvePlaybookTeamIds(raw, teams);
  if (fromStored.length) return fromStored;
  const inferred = inferTeamIdFromPlaybook(raw, teams);
  return inferred ? [inferred] : [];
}

function basePlaybookFields(raw: LegacyPlaybook) {
  const teamIds = resolveTeamIds(raw);
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    status: raw.status,
    alertCooldownMs: raw.alertCooldownMs,
    alert: normalizePlaybookAlert(raw.alert),
    teamIds: teamIds.length ? teamIds : undefined,
    teamId: teamIds[0],
    routedRoles: raw.routedRoles,
    actionItems: raw.actionItems?.length
      ? raw.actionItems
      : DEFAULT_ACTION_ITEMS,
    guidance: raw.guidance?.length ? raw.guidance : DEFAULT_GUIDANCE,
    isPremium: raw.isPremium,
    premiumPrice: raw.premiumPrice,
    builtinId: raw.builtinId,
    lastTriggeredAt: raw.lastTriggeredAt,
  };
}

export function migratePlaybook(raw: LegacyPlaybook): Playbook {
  if (raw.conditionGroups?.length) {
    return {
      ...basePlaybookFields(raw),
      conditions: raw.conditions ?? [],
      matchMode: raw.matchMode ?? "any",
      conditionGroups: raw.conditionGroups,
      groupMatchMode: raw.groupMatchMode ?? raw.matchMode ?? "any",
    };
  }

  if (raw.conditions?.length) {
    return {
      ...basePlaybookFields(raw),
      conditions: raw.conditions,
      matchMode: raw.matchMode ?? "all",
    };
  }

  const rules = [
    ...flattenRuleNode(raw.runRules),
    ...flattenRuleNode(raw.triggerRules),
  ].filter((r) => r.signalId);

  const conditions: PlaybookCondition[] = rules.map((rule) => ({
    id: newConditionId(),
    rule,
  }));

  return {
    ...basePlaybookFields(raw),
    conditions,
    matchMode: "all",
  };
}
