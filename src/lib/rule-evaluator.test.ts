import { describe, expect, it } from "vitest";
import {
  evaluateConditions,
  evaluateRule,
  evaluateRuleNode,
  durationToMs,
} from "./rule-evaluator";
import type { DcsTagWithKey, RuleNode, ValuePoint } from "./types";

const now = 1_700_000_000_000;

const tag: DcsTagWithKey = {
  id: "TE-3301/_.PV#Value",
  value: 85,
  name: "Reactor temp",
  desc: "Process temperature",
  category: "Temperature",
  fieldType: "analog",
  frequency: "1min",
  displayLabel: "Reactor Temp PV",
  unit: "°C",
  _key: "TE-3301/_.PV#Value::Reactor Temp PV::1",
};

const tags = [tag];
const key = tag._key;

function buf(points: { value: number; minutesAgo: number }[]): ValuePoint[] {
  return points.map((p) => ({
    value: p.value,
    timestamp: now - p.minutesAgo * 60_000,
  }));
}

describe("evaluateRule", () => {
  it("instant comparison uses latest buffer value", () => {
    const buffers = { [key]: buf([{ value: 95, minutesAgo: 1 }]) };
    expect(
      evaluateRule(
        { signalId: tag.id, displayLabel: tag.displayLabel, operator: ">", threshold: 90 },
        tags,
        buffers,
        now,
      ),
    ).toBe(true);
  });

  it("for 1h requires all points in window to satisfy", () => {
    const buffers = {
      [key]: buf([
        { value: 18, minutesAgo: 10 },
        { value: 19, minutesAgo: 5 },
        { value: 17, minutesAgo: 1 },
      ]),
    };
    const rule = {
      signalId: tag.id,
      displayLabel: tag.displayLabel,
      operator: "<" as const,
      threshold: 20,
      duration: { value: 1, unit: "h" as const },
      aggregation: "instant" as const,
    };
    expect(evaluateRule(rule, tags, buffers, now)).toBe(true);

    buffers[key].push({ value: 25, timestamp: now - 30_000 });
    expect(evaluateRule(rule, tags, buffers, now)).toBe(false);
  });

  it("6h avg above threshold", () => {
    const buffers = {
      [key]: buf([
        { value: 88, minutesAgo: 300 },
        { value: 92, minutesAgo: 200 },
        { value: 94, minutesAgo: 100 },
        { value: 96, minutesAgo: 1 },
      ]),
    };
    expect(
      evaluateRule(
        {
          signalId: tag.id,
          displayLabel: tag.displayLabel,
          operator: ">",
          threshold: 91,
          duration: { value: 6, unit: "h" },
          aggregation: "avg",
        },
        tags,
        buffers,
        now,
      ),
    ).toBe(true);
  });
});

describe("evaluateRuleNode", () => {
  it("nested OR inside AND", () => {
    const buffers = {
      [key]: buf([{ value: 16, minutesAgo: 1 }]),
    };

    const tree: RuleNode = {
      type: "group",
      logic: "and",
      children: [
        {
          type: "group",
          logic: "or",
          children: [
            {
              type: "condition",
              rule: {
                signalId: tag.id,
                displayLabel: tag.displayLabel,
                operator: ">",
                threshold: 100,
              },
            },
            {
              type: "condition",
              rule: {
                signalId: tag.id,
                displayLabel: tag.displayLabel,
                operator: "<",
                threshold: 20,
              },
            },
          ],
        },
        {
          type: "condition",
          rule: {
            signalId: tag.id,
            displayLabel: tag.displayLabel,
            operator: ">",
            threshold: 10,
          },
        },
      ],
    };

    expect(evaluateRuleNode(tree, tags, buffers, now)).toBe(true);
  });

  it("empty group returns false", () => {
    expect(
      evaluateRuleNode(
        { type: "group", logic: "and", children: [] },
        tags,
        {},
        now,
      ),
    ).toBe(false);
  });
});

describe("evaluateConditions", () => {
  it("match all requires every rule", () => {
    const buffers = {
      [key]: buf([{ value: 95, minutesAgo: 1 }]),
    };
    expect(
      evaluateConditions(
        [
          {
            id: "1",
            rule: {
              signalId: tag.id,
              displayLabel: tag.displayLabel,
              operator: ">",
              threshold: 90,
            },
          },
          {
            id: "2",
            rule: {
              signalId: tag.id,
              displayLabel: tag.displayLabel,
              operator: "<",
              threshold: 100,
            },
          },
        ],
        "all",
        tags,
        buffers,
        now,
      ),
    ).toBe(true);
  });

  it("match any passes with one rule", () => {
    const buffers = { [key]: buf([{ value: 50, minutesAgo: 1 }]) };
    expect(
      evaluateConditions(
        [
          {
            id: "1",
            rule: {
              signalId: tag.id,
              displayLabel: tag.displayLabel,
              operator: ">",
              threshold: 90,
            },
          },
          {
            id: "2",
            rule: {
              signalId: tag.id,
              displayLabel: tag.displayLabel,
              operator: "<",
              threshold: 100,
            },
          },
        ],
        "any",
        tags,
        buffers,
        now,
      ),
    ).toBe(true);
  });
});

describe("durationToMs", () => {
  it("converts hours and minutes", () => {
    expect(durationToMs({ value: 1, unit: "h" })).toBe(3_600_000);
    expect(durationToMs({ value: 30, unit: "min" })).toBe(1_800_000);
  });
});
