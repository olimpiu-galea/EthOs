import type { PlaybookCondition, PlaybookConditionGroup } from "./types";
import { createEmptyCondition } from "./playbook-utils";
import {
  fermAceticSignal,
  fermCellCountSignal,
  fermPotentialSignal,
  fermSignalDisplayLabel,
} from "./ferm-signals";

export const ACETIC_BUILTIN_ID = "acetic-infection-risk";
export const ACETIC_PLAYBOOK_NAME = "Acetic infection risk";

type CheckpointHour = "yp" | 6 | 12 | 18 | 24 | 30 | 40 | 50;

type RuleRow = {
  checkpoint: CheckpointHour;
  aceticMin: number;
  secondary:
    | { kind: "cellCount"; max: number }
    | { kind: "potential"; max: number };
  classificationRule: string;
};

const RULES: RuleRow[] = [
  {
    checkpoint: "yp",
    aceticMin: 0.007,
    secondary: { kind: "cellCount", max: 120 },
    classificationRule:
      "Flag risk if Acetic >= 0.007 AND Cell Count < 120",
  },
  {
    checkpoint: "yp",
    aceticMin: 0.016,
    secondary: { kind: "cellCount", max: 80 },
    classificationRule:
      "Flag risk if Acetic >= 0.016 AND Cell Count < 80",
  },
  {
    checkpoint: 6,
    aceticMin: 0.026,
    secondary: { kind: "cellCount", max: 45 },
    classificationRule: "Bad if Acetic >= 0.026 AND Cell Count < 45",
  },
  {
    checkpoint: 12,
    aceticMin: 0.021,
    secondary: { kind: "potential", max: 15.5 },
    classificationRule: "Bad if Acetic >= 0.021 AND Potential < 15.5",
  },
  {
    checkpoint: 18,
    aceticMin: 0.02,
    secondary: { kind: "potential", max: 15.8 },
    classificationRule: "Bad if Acetic >= 0.02 AND Potential < 15.8",
  },
  {
    checkpoint: 24,
    aceticMin: 0.022,
    secondary: { kind: "potential", max: 15.5 },
    classificationRule: "Bad if Acetic >= 0.022 AND Potential < 15.5",
  },
  {
    checkpoint: 30,
    aceticMin: 0.028,
    secondary: { kind: "potential", max: 15.6 },
    classificationRule: "Bad if Acetic >= 0.028 AND Potential < 15.6",
  },
  {
    checkpoint: 40,
    aceticMin: 0.034,
    secondary: { kind: "potential", max: 15.6 },
    classificationRule: "Bad if Acetic >= 0.034 AND Potential < 15.6",
  },
  {
    checkpoint: 50,
    aceticMin: 0.037,
    secondary: { kind: "potential", max: 15.6 },
    classificationRule: "Bad if Acetic >= 0.037 AND Potential < 15.6",
  },
];

function aceticCondition(
  checkpoint: CheckpointHour,
  min: number,
): PlaybookCondition {
  const cond = createEmptyCondition();
  cond.rule = {
    signalId: fermAceticSignal(checkpoint),
    displayLabel: fermSignalDisplayLabel(checkpoint, "Acetic"),
    operator: ">=",
    threshold: min,
    aggregation: "instant",
  };
  return cond;
}

function secondaryCondition(
  checkpoint: CheckpointHour,
  secondary: RuleRow["secondary"],
): PlaybookCondition {
  const cond = createEmptyCondition();
  if (secondary.kind === "cellCount") {
    cond.rule = {
      signalId: fermCellCountSignal(checkpoint),
      displayLabel: fermSignalDisplayLabel(checkpoint, "Cell Count"),
      operator: "<",
      threshold: secondary.max,
      aggregation: "instant",
    };
  } else {
    cond.rule = {
      signalId: fermPotentialSignal(checkpoint),
      displayLabel: fermSignalDisplayLabel(checkpoint, "Potential"),
      operator: "<",
      threshold: secondary.max,
      aggregation: "instant",
    };
  }
  return cond;
}

function ruleToGroup(rule: RuleRow): PlaybookConditionGroup {
  return {
    id: crypto.randomUUID(),
    label: rule.classificationRule,
    matchMode: "all",
    conditions: [
      aceticCondition(rule.checkpoint, rule.aceticMin),
      secondaryCondition(rule.checkpoint, rule.secondary),
    ],
  };
}

export function buildAceticConditionGroups(): PlaybookConditionGroup[] {
  return RULES.map(ruleToGroup);
}

export function buildAceticConditions(): PlaybookCondition[] {
  return buildAceticConditionGroups().flatMap((g) => g.conditions);
}
