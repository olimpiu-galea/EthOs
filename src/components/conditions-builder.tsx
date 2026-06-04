"use client";

import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type {
  ConditionMatchMode,
  DcsTagWithKey,
  PlaybookCondition,
  Rule,
} from "@/lib/types";
import { conditionsPreview } from "@/lib/rule-evaluator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  createEmptyCondition,
  hasValidConditions,
} from "@/lib/playbook-utils";

export { hasValidConditions, createEmptyCondition };

type Props = {
  conditions: PlaybookCondition[];
  matchMode: ConditionMatchMode;
  onConditionsChange: (conditions: PlaybookCondition[]) => void;
  onMatchModeChange: (mode: ConditionMatchMode) => void;
  tags: DcsTagWithKey[];
  disabled?: boolean;
  alertTitle?: string;
};

function updateCondition(
  conditions: PlaybookCondition[],
  id: string,
  patch: Partial<Rule>,
): PlaybookCondition[] {
  return conditions.map((c) =>
    c.id === id ? { ...c, rule: { ...c.rule, ...patch } } : c,
  );
}

export function ConditionsBuilder({
  conditions,
  matchMode,
  onConditionsChange,
  onMatchModeChange,
  tags,
  disabled,
  alertTitle = "Alert",
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const preview = conditionsPreview(conditions, matchMode);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-primary/40 bg-primary/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          When this fires
        </p>
        <p className="text-lg font-semibold leading-snug text-foreground">
          {preview ? (
            <>
              <span className="text-primary">IF</span> {preview}
              <br />
              <span className="text-primary">THEN</span> → {alertTitle}
            </>
          ) : (
            <span className="text-muted-foreground">
              Add at least one signal condition below
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Match</Label>
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMatchModeChange("all")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-colors",
              matchMode === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:text-foreground",
            )}
          >
            ALL conditions
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMatchModeChange("any")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-colors",
              matchMode === "any"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:text-foreground",
            )}
          >
            ANY condition
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {conditions.map((cond, index) => {
          const r = cond.rule;
          const isAdvanced = expanded[cond.id];
          const tag = tags.find(
            (t) =>
              t.id === r.signalId &&
              (!r.displayLabel || t.displayLabel === r.displayLabel),
          );

          return (
            <div
              key={cond.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">
                  Condition {index + 1}
                </span>
                {conditions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="text-destructive hover:text-destructive h-8"
                    onClick={() =>
                      onConditionsChange(
                        conditions.filter((c) => c.id !== cond.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-12 items-end">
                <div className="sm:col-span-6 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Signal</Label>
                  <Select
                    disabled={disabled || tags.length === 0}
                    value={
                      r.signalId
                        ? `${r.signalId}|||${r.displayLabel ?? ""}`
                        : undefined
                    }
                    onValueChange={(v) => {
                      const [signalId, displayLabel] = v.split("|||");
                      const t = tags.find(
                        (x) =>
                          x.id === signalId &&
                          x.displayLabel === displayLabel,
                      );
                      onConditionsChange(
                        updateCondition(conditions, cond.id, {
                          signalId,
                          displayLabel: displayLabel || undefined,
                          threshold:
                            t && typeof t.value === "number"
                              ? Number(t.value)
                              : r.threshold,
                        }),
                      );
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a tag…" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((t) => (
                        <SelectItem
                          key={t._key}
                          value={`${t.id}|||${t.displayLabel}`}
                        >
                          {t.displayLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Is</Label>
                  <Select
                    disabled={disabled}
                    value={r.operator}
                    onValueChange={(op) =>
                      onConditionsChange(
                        updateCondition(conditions, cond.id, {
                          operator: op as Rule["operator"],
                        }),
                      )
                    }
                  >
                    <SelectTrigger className="h-11 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {([">", "<", ">=", "<=", "==", "!="] as const).map(
                        (op) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Value {tag?.unit ? `(${tag.unit})` : ""}
                  </Label>
                  <Input
                    type="number"
                    disabled={disabled}
                    className="h-11 text-lg font-semibold tabular-nums"
                    value={r.threshold}
                    onChange={(e) =>
                      onConditionsChange(
                        updateCondition(conditions, cond.id, {
                          threshold: Number(e.target.value),
                        }),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end pb-1">
                  {index < conditions.length - 1 && (
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {matchMode === "all" ? "and" : "or"}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [cond.id]: !e[cond.id] }))
                }
              >
                {isAdvanced ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Time window & averaging (optional)
              </button>

              {isAdvanced && (
                <div className="grid gap-3 sm:grid-cols-3 pt-1 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Over</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="—"
                        disabled={disabled}
                        value={r.duration?.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            const next = { ...r };
                            delete next.duration;
                            onConditionsChange(
                              conditions.map((c) =>
                                c.id === cond.id ? { ...c, rule: next } : c,
                              ),
                            );
                            return;
                          }
                          onConditionsChange(
                            updateCondition(conditions, cond.id, {
                              duration: {
                                value: Number(val),
                                unit: r.duration?.unit ?? "h",
                              },
                            }),
                          );
                        }}
                      />
                      <Select
                        disabled={disabled}
                        value={r.duration?.unit ?? "h"}
                        onValueChange={(unit) => {
                          if (!r.duration) return;
                          onConditionsChange(
                            updateCondition(conditions, cond.id, {
                              duration: {
                                ...r.duration,
                                unit: unit as "min" | "h",
                              },
                            }),
                          );
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="min">min</SelectItem>
                          <SelectItem value="h">hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Calculate as</Label>
                    <Select
                      disabled={disabled}
                      value={r.aggregation ?? "instant"}
                      onValueChange={(v) =>
                        onConditionsChange(
                          updateCondition(conditions, cond.id, {
                            aggregation: v as Rule["aggregation"],
                          }),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Current value</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full h-12 border-dashed border-primary/40 text-primary hover:bg-primary/10"
        onClick={() =>
          onConditionsChange([...conditions, createEmptyCondition()])
        }
      >
        <Plus className="h-5 w-5 mr-2" />
        Add another condition
      </Button>
    </div>
  );
}
