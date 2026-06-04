import type { LegacyPlaybook, Playbook, PlaybookCondition } from "./types";
import { flattenRuleNode } from "./rule-evaluator";

function newConditionId(): string {
  return crypto.randomUUID();
}

export function migratePlaybook(raw: LegacyPlaybook): Playbook {
  if (raw.conditions?.length) {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      status: raw.status,
      conditions: raw.conditions,
      matchMode: raw.matchMode ?? "all",
      alertCooldownMs: raw.alertCooldownMs,
      alert: raw.alert,
      lastTriggeredAt: raw.lastTriggeredAt,
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
    id: raw.id,
    name: raw.name,
    description: raw.description,
    status: raw.status,
    conditions,
    matchMode: "all",
    alert: raw.alert,
    lastTriggeredAt: raw.lastTriggeredAt,
  };
}
