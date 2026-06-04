import type { PlaybookCondition } from "./types";

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

export function hasValidConditions(conditions: PlaybookCondition[]): boolean {
  return conditions.some((c) => Boolean(c.rule.signalId));
}
