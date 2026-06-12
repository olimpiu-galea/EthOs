import type { PlaybookCondition, PlaybookConditionGroup } from "./types";
import { createEmptyCondition } from "./playbook-utils";
import {
  fermPotentialSignal,
  fermSignalDisplayLabel,
  fermTempSignal,
} from "./ferm-signals";

export const POTENTIAL_VS_TEMP_BUILTIN_ID = "potential-vs-temp";
export const POTENTIAL_VS_TEMP_PLAYBOOK_NAME = "Potential vs Temp";

type PotentialRefHour = "yp" | 6 | 12 | 18 | 24 | 30 | 40 | 50;

type RuleRow = {
  targetHour: number;
  potentialRefHour: PotentialRefHour;
  potentialBand:
    | { kind: "any" }
    | { kind: "lt"; value: number }
    | { kind: "gt"; value: number }
    | { kind: "range"; min: number; max: number };
  tempMax?: number;
  classificationRule: string;
};

const RULES: RuleRow[] = [
  {
    targetHour: 6,
    potentialRefHour: "yp",
    potentialBand: { kind: "any" },
    tempMax: 91.0,
    classificationRule: "Bad if Potential band = Any AND Temp(6h) >= 91.0",
  },
  {
    targetHour: 12,
    potentialRefHour: 6,
    potentialBand: { kind: "lt", value: 14.7 },
    tempMax: 90.5,
    classificationRule: "Bad if Potential(6h) < 14.7 AND Temp(12h) >= 90.5",
  },
  {
    targetHour: 12,
    potentialRefHour: 6,
    potentialBand: { kind: "gt", value: 14.7 },
    tempMax: 91.0,
    classificationRule: "Bad if Potential(6h) > 14.7 AND Temp(12h) >= 91.0",
  },
  {
    targetHour: 18,
    potentialRefHour: 12,
    potentialBand: { kind: "lt", value: 14.8 },
    classificationRule:
      "Bad signal if Potential(12h) < 14.8 (generally bad batches; Temp at 18h not decisive)",
  },
  {
    targetHour: 18,
    potentialRefHour: 12,
    potentialBand: { kind: "range", min: 14.8, max: 15.2 },
    tempMax: 91.0,
    classificationRule:
      "Bad if Potential(12h) in [14.8, 15.2] AND Temp(18h) >= 91.0",
  },
  {
    targetHour: 18,
    potentialRefHour: 12,
    potentialBand: { kind: "range", min: 15.2, max: 15.4 },
    tempMax: 92.0,
    classificationRule:
      "Bad if Potential(12h) in [15.2, 15.4] AND Temp(18h) >= 92.0",
  },
  {
    targetHour: 18,
    potentialRefHour: 12,
    potentialBand: { kind: "gt", value: 15.4 },
    tempMax: 95.0,
    classificationRule: "Bad if Potential(12h) > 15.4 AND Temp(18h) >= 95.0",
  },
  {
    targetHour: 24,
    potentialRefHour: 18,
    potentialBand: { kind: "lt", value: 14.8 },
    classificationRule:
      "Bad signal if Potential(18h) < 14.8 (generally bad batches; Temp at 24h not decisive)",
  },
  {
    targetHour: 24,
    potentialRefHour: 18,
    potentialBand: { kind: "range", min: 14.8, max: 15.4 },
    tempMax: 94.0,
    classificationRule:
      "Bad if Potential(18h) in [14.8, 15.4] AND Temp(24h) >= 94.0",
  },
  {
    targetHour: 24,
    potentialRefHour: 18,
    potentialBand: { kind: "range", min: 15.4, max: 15.7 },
    tempMax: 95.0,
    classificationRule:
      "Bad if Potential(18h) in [15.4, 15.7] AND Temp(24h) >= 95.0",
  },
  {
    targetHour: 24,
    potentialRefHour: 18,
    potentialBand: { kind: "gt", value: 15.7 },
    tempMax: 96.0,
    classificationRule: "Bad if Potential(18h) > 15.7 AND Temp(24h) >= 96.0",
  },
  {
    targetHour: 30,
    potentialRefHour: 24,
    potentialBand: { kind: "lt", value: 14.7 },
    classificationRule:
      "Bad signal if Potential(24h) < 14.7 (generally bad batches; Temp at 30h not decisive)",
  },
  {
    targetHour: 30,
    potentialRefHour: 24,
    potentialBand: { kind: "range", min: 14.7, max: 15.2 },
    tempMax: 91.0,
    classificationRule:
      "Bad if Potential(24h) in [14.7, 15.2] AND Temp(30h) >= 91.0",
  },
  {
    targetHour: 30,
    potentialRefHour: 24,
    potentialBand: { kind: "range", min: 15.2, max: 15.4 },
    tempMax: 93.0,
    classificationRule:
      "Bad if Potential(24h) in [15.2, 15.4] AND Temp(30h) >= 93.0",
  },
  {
    targetHour: 30,
    potentialRefHour: 24,
    potentialBand: { kind: "range", min: 15.4, max: 15.7 },
    tempMax: 95.0,
    classificationRule:
      "Bad if Potential(24h) in [15.4, 15.7] AND Temp(30h) >= 95.0",
  },
  {
    targetHour: 30,
    potentialRefHour: 24,
    potentialBand: { kind: "gt", value: 15.7 },
    tempMax: 97.0,
    classificationRule: "Bad if Potential(24h) > 15.7 AND Temp(30h) >= 97.0",
  },
  {
    targetHour: 40,
    potentialRefHour: 30,
    potentialBand: { kind: "lt", value: 14.7 },
    classificationRule:
      "Bad signal if Potential(30h) < 14.7 (generally bad batches; Temp at 40h not decisive)",
  },
  {
    targetHour: 40,
    potentialRefHour: 30,
    potentialBand: { kind: "range", min: 14.7, max: 15.2 },
    tempMax: 91.0,
    classificationRule:
      "Bad if Potential(30h) in [14.7, 15.2] AND Temp(40h) >= 91.0",
  },
  {
    targetHour: 40,
    potentialRefHour: 30,
    potentialBand: { kind: "range", min: 15.2, max: 15.5 },
    tempMax: 92.0,
    classificationRule:
      "Bad if Potential(30h) in [15.2, 15.5] AND Temp(40h) >= 92.0",
  },
  {
    targetHour: 40,
    potentialRefHour: 30,
    potentialBand: { kind: "gt", value: 15.5 },
    tempMax: 97.0,
    classificationRule: "Bad if Potential(30h) > 15.5 AND Temp(40h) >= 97.0",
  },
  {
    targetHour: 50,
    potentialRefHour: 40,
    potentialBand: { kind: "lt", value: 14.7 },
    classificationRule:
      "Bad signal if Potential(40h) < 14.7 (generally bad batches; Temp at 50h not decisive)",
  },
  {
    targetHour: 50,
    potentialRefHour: 40,
    potentialBand: { kind: "range", min: 14.7, max: 15.5 },
    tempMax: 91.0,
    classificationRule:
      "Bad if Potential(40h) in [14.7, 15.5] AND Temp(50h) >= 91.0",
  },
  {
    targetHour: 50,
    potentialRefHour: 40,
    potentialBand: { kind: "gt", value: 15.5 },
    tempMax: 93.0,
    classificationRule: "Bad if Potential(40h) > 15.5 AND Temp(50h) >= 93.0",
  },
];

function potentialBandConditions(
  refHour: PotentialRefHour,
  band: RuleRow["potentialBand"],
): PlaybookCondition[] {
  if (band.kind === "any") return [];

  const signalId = fermPotentialSignal(refHour);
  const displayLabel = fermSignalDisplayLabel(refHour, "Potential");

  if (band.kind === "lt") {
    const cond = createEmptyCondition();
    cond.rule = {
      signalId,
      displayLabel,
      operator: "<",
      threshold: band.value,
      aggregation: "instant",
    };
    return [cond];
  }

  if (band.kind === "gt") {
    const cond = createEmptyCondition();
    cond.rule = {
      signalId,
      displayLabel,
      operator: ">",
      threshold: band.value,
      aggregation: "instant",
    };
    return [cond];
  }

  const minCond = createEmptyCondition();
  minCond.rule = {
    signalId,
    displayLabel,
    operator: ">=",
    threshold: band.min,
    aggregation: "instant",
  };
  const maxCond = createEmptyCondition();
  maxCond.rule = {
    signalId,
    displayLabel,
    operator: "<=",
    threshold: band.max,
    aggregation: "instant",
  };
  return [minCond, maxCond];
}

function tempCondition(targetHour: number, tempMax: number): PlaybookCondition {
  const cond = createEmptyCondition();
  cond.rule = {
    signalId: fermTempSignal(targetHour),
    displayLabel: fermSignalDisplayLabel(targetHour, "Temp"),
    operator: ">=",
    threshold: tempMax,
    aggregation: "instant",
  };
  return cond;
}

function ruleToGroup(rule: RuleRow): PlaybookConditionGroup {
  const conditions = [
    ...potentialBandConditions(rule.potentialRefHour, rule.potentialBand),
    ...(rule.tempMax != null
      ? [tempCondition(rule.targetHour, rule.tempMax)]
      : []),
  ];

  return {
    id: crypto.randomUUID(),
    label: rule.classificationRule,
    matchMode: "all",
    conditions,
  };
}

/** Grouped rules: AND within each row, OR between rows */
export function buildPotentialVsTempConditionGroups(): PlaybookConditionGroup[] {
  return RULES.map(ruleToGroup);
}

/** Flat list — legacy / tag activation */
export function buildPotentialVsTempConditions(): PlaybookCondition[] {
  return buildPotentialVsTempConditionGroups().flatMap((g) => g.conditions);
}
