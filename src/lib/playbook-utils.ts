import type {
  Playbook,
  PlaybookCondition,
  PlaybookConditionGroup,
} from "./types";

export function createEmptyCondition(): PlaybookCondition {
  return {
    id: crypto.randomUUID(),
    rule: {
      signalId: "",
      operator: ">",
      threshold: 0,
      aggregation: "instant",
    },
  };
}

export function createEmptyConditionGroup(): PlaybookConditionGroup {
  return {
    id: crypto.randomUUID(),
    matchMode: "all",
    conditions: [createEmptyCondition()],
  };
}

export function hasValidConditions(conditions: PlaybookCondition[]): boolean {
  return conditions.some((c) => Boolean(c.rule.signalId));
}

export function hasValidConditionGroups(
  groups: PlaybookConditionGroup[] | undefined,
): boolean {
  if (!groups?.length) return false;
  return groups.some((g) => hasValidConditions(g.conditions));
}

export function usesConditionGroups(
  playbook: Pick<Playbook, "conditionGroups">,
): boolean {
  return (playbook.conditionGroups?.length ?? 0) > 0;
}

export function playbookConditionsFlat(
  playbook: Pick<Playbook, "conditions" | "conditionGroups">,
): PlaybookCondition[] {
  if (usesConditionGroups(playbook)) {
    return playbook.conditionGroups!.flatMap((g) => g.conditions);
  }
  return playbook.conditions;
}

export function hasValidPlaybookConditions(
  playbook: Pick<Playbook, "conditions" | "conditionGroups">,
): boolean {
  if (usesConditionGroups(playbook)) {
    return hasValidConditionGroups(playbook.conditionGroups);
  }
  return hasValidConditions(playbook.conditions);
}

export function flattenConditionsToPlaybook(
  playbook: Pick<
    Playbook,
    "conditions" | "matchMode" | "conditionGroups" | "groupMatchMode"
  >,
): Pick<Playbook, "conditions" | "matchMode" | "conditionGroups" | "groupMatchMode"> {
  if (usesConditionGroups(playbook)) {
    return {
      conditions: [],
      matchMode: playbook.groupMatchMode ?? playbook.matchMode,
      conditionGroups: playbook.conditionGroups,
      groupMatchMode: playbook.groupMatchMode ?? playbook.matchMode,
    };
  }
  return {
    conditions: playbook.conditions,
    matchMode: playbook.matchMode,
    conditionGroups: undefined,
    groupMatchMode: undefined,
  };
}
