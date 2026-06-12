import type {
  ConditionMatchMode,
  DcsTagWithKey,
  Playbook,
  PlaybookCondition,
  PlaybookConditionGroup,
  Rule,
  RuleNode,
  ValuePoint,
} from "./types";
import { usesConditionGroups } from "./playbook-utils";
import { numericValue, tagKey } from "./dcs-parser";
import { canonicalSignalLabel } from "./ferm-signals";

export type TagBufferMap = Record<string, ValuePoint[]>;

const MS_PER_MIN = 60_000;
const MS_PER_H = 3_600_000;

export function frequencyToMs(frequency: string): number {
  const f = frequency.toLowerCase().trim();
  if (f === "1min" || f === "1m") return MS_PER_MIN;
  if (f === "5min" || f === "5m") return 5 * MS_PER_MIN;
  if (f === "1h" || f === "60min") return MS_PER_H;
  return MS_PER_MIN;
}

export function durationToMs(duration: { value: number; unit: "min" | "h" }): number {
  return duration.unit === "h"
    ? duration.value * MS_PER_H
    : duration.value * MS_PER_MIN;
}

export function trimBuffer(
  points: ValuePoint[],
  maxAgeMs: number,
  now: number,
): ValuePoint[] {
  const cutoff = now - maxAgeMs;
  return points.filter((p) => p.timestamp >= cutoff);
}

export function findTag(
  tags: DcsTagWithKey[],
  rule: Rule,
): DcsTagWithKey | undefined {
  if (rule.displayLabel) {
    const exact = tags.find(
      (t) => t.id === rule.signalId && t.displayLabel === rule.displayLabel,
    );
    if (exact) return exact;
  }
  return tags.find((t) => t.id === rule.signalId);
}

function pointsInWindow(
  buffer: ValuePoint[],
  windowMs: number,
  now: number,
): ValuePoint[] {
  const cutoff = now - windowMs;
  return buffer.filter((p) => p.timestamp >= cutoff);
}

function compare(a: number, op: Rule["operator"], threshold: number): boolean {
  switch (op) {
    case ">":
      return a > threshold;
    case "<":
      return a < threshold;
    case ">=":
      return a >= threshold;
    case "<=":
      return a <= threshold;
    case "==":
      return a === threshold;
    case "!=":
      return a !== threshold;
    default:
      return false;
  }
}

function aggregateValue(
  points: ValuePoint[],
  aggregation: Rule["aggregation"],
): number | null {
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const agg = aggregation ?? "instant";

  if (agg === "instant") return values[values.length - 1];
  if (agg === "avg")
    return values.reduce((s, v) => s + v, 0) / values.length;
  if (agg === "max") return Math.max(...values);
  if (agg === "min") return Math.min(...values);
  return values[values.length - 1];
}

export function evaluateRule(
  rule: Rule,
  tags: DcsTagWithKey[],
  buffers: TagBufferMap,
  now: number,
): boolean {
  const tag = findTag(tags, rule);
  if (!tag) return false;

  const key = tagKey(tag);
  const buffer = buffers[key] ?? [];
  const freqMs = frequencyToMs(tag.frequency);
  const maxHistory = 6 * MS_PER_H;
  const trimmed = pointsInWindow(buffer, maxHistory, now);

  const aggregation = rule.aggregation ?? "instant";

  if (!rule.duration) {
    const latest =
      trimmed.length > 0
        ? trimmed[trimmed.length - 1].value
        : numericValue(tag.value);
    return compare(latest, rule.operator, rule.threshold);
  }

  const windowMs = Math.max(durationToMs(rule.duration), freqMs);
  const windowPoints = pointsInWindow(trimmed, windowMs, now);

  if (windowPoints.length === 0) {
    const fallback = numericValue(tag.value);
    return compare(fallback, rule.operator, rule.threshold);
  }

  if (aggregation === "instant" && rule.duration) {
    return windowPoints.every((p) =>
      compare(p.value, rule.operator, rule.threshold),
    );
  }

  const aggVal = aggregateValue(windowPoints, aggregation);
  if (aggVal === null) return false;
  return compare(aggVal, rule.operator, rule.threshold);
}

export function evaluateConditions(
  conditions: PlaybookCondition[],
  matchMode: ConditionMatchMode,
  tags: DcsTagWithKey[],
  buffers: TagBufferMap,
  now: number,
): boolean {
  const valid = conditions.filter((c) => c.rule.signalId);
  if (valid.length === 0) return false;

  const results = valid.map((c) =>
    evaluateRule(c.rule, tags, buffers, now),
  );

  return matchMode === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
}

export function rulePreview(rule: Rule): string {
  const dur = rule.duration
    ? ` for ${rule.duration.value}${rule.duration.unit}`
    : "";
  const agg =
    rule.aggregation && rule.aggregation !== "instant"
      ? ` ${rule.aggregation}`
      : "";
  const label = canonicalSignalLabel(rule);
  return `${label} ${rule.operator} ${rule.threshold}${agg}${dur}`;
}

export function conditionsPreviewLines(
  conditions: PlaybookCondition[],
): string[] {
  return conditions
    .filter((c) => c.rule.signalId)
    .map((c) => rulePreview(c.rule));
}

export function conditionsPreview(
  conditions: PlaybookCondition[],
  matchMode: ConditionMatchMode,
): string {
  const parts = conditionsPreviewLines(conditions);
  if (parts.length === 0) return "";
  const join = matchMode === "all" ? " AND " : " OR ";
  return parts.join(join);
}

function groupPreview(group: PlaybookConditionGroup): string {
  const inner = conditionsPreview(
    group.conditions,
    group.matchMode ?? "all",
  );
  if (!inner) return "";
  const valid = group.conditions.filter((c) => c.rule.signalId);
  if (valid.length <= 1) return inner;
  return `(${inner})`;
}

export function conditionsPreviewForPlaybook(
  playbook: Pick<
    Playbook,
    "conditions" | "matchMode" | "conditionGroups" | "groupMatchMode"
  >,
): string {
  if (usesConditionGroups(playbook)) {
    const between = playbook.groupMatchMode ?? playbook.matchMode ?? "any";
    const parts = playbook.conditionGroups!
      .map(groupPreview)
      .filter(Boolean);
    if (parts.length === 0) return "";
    const join = between === "all" ? " AND " : " OR ";
    return parts.join(join);
  }
  return conditionsPreview(playbook.conditions, playbook.matchMode);
}

export function conditionsPreviewLinesForPlaybook(
  playbook: Pick<
    Playbook,
    "conditions" | "matchMode" | "conditionGroups" | "groupMatchMode"
  >,
): string[] {
  if (!usesConditionGroups(playbook)) {
    return conditionsPreviewLines(playbook.conditions);
  }

  const between = playbook.groupMatchMode ?? playbook.matchMode ?? "any";
  const betweenLabel = between === "all" ? "AND" : "OR";
  const lines: string[] = [];

  playbook.conditionGroups!.forEach((group, groupIndex) => {
    if (groupIndex > 0) lines.push(betweenLabel);
    if (group.label?.trim()) {
      lines.push(group.label.trim());
    }
    const innerLines = conditionsPreviewLines(group.conditions);
    const innerJoin =
      (group.matchMode ?? "all") === "all" ? "AND" : "OR";
    innerLines.forEach((line, condIndex) => {
      if (condIndex > 0) lines.push(innerJoin);
      lines.push(line);
    });
  });

  return lines;
}

export function evaluatePlaybookConditions(
  playbook: Pick<
    Playbook,
    "conditions" | "matchMode" | "conditionGroups" | "groupMatchMode"
  >,
  tags: DcsTagWithKey[],
  buffers: TagBufferMap,
  now: number,
): boolean {
  if (usesConditionGroups(playbook)) {
    const between = playbook.groupMatchMode ?? playbook.matchMode ?? "any";
    const results = playbook.conditionGroups!.map((group) =>
      evaluateConditions(
        group.conditions,
        group.matchMode ?? "all",
        tags,
        buffers,
        now,
      ),
    );
    return between === "all"
      ? results.every(Boolean)
      : results.some(Boolean);
  }
  return evaluateConditions(
    playbook.conditions,
    playbook.matchMode,
    tags,
    buffers,
    now,
  );
}

export function flattenRuleNode(node: RuleNode | undefined): Rule[] {
  if (!node) return [];
  if (node.type === "condition") return [node.rule];
  return node.children.flatMap(flattenRuleNode);
}

export function evaluateRuleNode(
  node: RuleNode,
  tags: DcsTagWithKey[],
  buffers: TagBufferMap,
  now: number,
): boolean {
  if (node.type === "condition") {
    return evaluateRule(node.rule, tags, buffers, now);
  }

  if (node.children.length === 0) return false;

  if (node.logic === "and") {
    return node.children.every((c) =>
      evaluateRuleNode(c, tags, buffers, now),
    );
  }
  return node.children.some((c) =>
    evaluateRuleNode(c, tags, buffers, now),
  );
}

export function ruleNodePreview(node: RuleNode): string {
  if (node.type === "condition") {
    const r = node.rule;
    const dur = r.duration
      ? ` for ${r.duration.value}${r.duration.unit}`
      : "";
    const agg =
      r.aggregation && r.aggregation !== "instant"
        ? ` ${r.aggregation}`
        : "";
    const label = canonicalSignalLabel(r);
    return `${label} ${r.operator} ${r.threshold}${agg}${dur}`;
  }

  const inner = node.children.map(ruleNodePreview).join(` ${node.logic.toUpperCase()} `);
  return node.children.length > 1 ? `(${inner})` : inner;
}

export function defaultGroup(): RuleNode {
  return { type: "group", logic: "and", children: [] };
}

export function defaultCondition(): RuleNode {
  return {
    type: "condition",
    rule: {
      signalId: "",
      operator: ">",
      threshold: 0,
      aggregation: "instant",
    },
  };
}
