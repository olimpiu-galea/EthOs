"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { conditionsPreview } from "@/lib/rule-evaluator";
import type {
  ConditionMatchMode,
  DcsTagWithKey,
  PlaybookCondition,
  PlaybookConditionGroup,
  Rule,
  SignalSource,
} from "@/lib/types";
import { conditionsPreviewLinesForPlaybook } from "@/lib/rule-evaluator";
import {
  createEmptyCondition,
  createEmptyConditionGroup,
  hasValidConditionGroups,
  hasValidConditions,
  usesConditionGroups,
} from "@/lib/playbook-utils";
import { ConditionRow, conditionRowSummary } from "@/components/condition-row";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export {
  createEmptyCondition,
  createEmptyConditionGroup,
  hasValidConditions,
  hasValidConditionGroups,
} from "@/lib/playbook-utils";

type Props = {
  conditions: PlaybookCondition[];
  matchMode: ConditionMatchMode;
  onConditionsChange: (conditions: PlaybookCondition[]) => void;
  onMatchModeChange: (mode: ConditionMatchMode) => void;
  conditionGroups?: PlaybookConditionGroup[];
  groupMatchMode?: ConditionMatchMode;
  onConditionGroupsChange?: (groups: PlaybookConditionGroup[]) => void;
  onGroupMatchModeChange?: (mode: ConditionMatchMode) => void;
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

function updateGroup(
  groups: PlaybookConditionGroup[],
  groupId: string,
  patch: Partial<PlaybookConditionGroup>,
): PlaybookConditionGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g));
}

function updateGroupCondition(
  groups: PlaybookConditionGroup[],
  groupId: string,
  conditionId: string,
  patch: Partial<Rule>,
): PlaybookConditionGroup[] {
  return groups.map((g) =>
    g.id === groupId
      ? {
          ...g,
          conditions: updateCondition(g.conditions, conditionId, patch),
        }
      : g,
  );
}

function MatchModeToggle({
  value,
  disabled,
  onChange,
  allLabel,
  anyLabel,
  compact,
}: {
  value: ConditionMatchMode;
  disabled?: boolean;
  onChange: (mode: ConditionMatchMode) => void;
  allLabel: string;
  anyLabel: string;
  compact?: boolean;
}) {
  const btn = compact
    ? "px-2.5 py-1 text-[11px] font-semibold"
    : "px-5 py-2.5 text-sm font-semibold";
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-border overflow-hidden",
        compact && "text-xs",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("all")}
        className={cn(
          btn,
          "transition-colors",
          value === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/30 text-muted-foreground hover:text-foreground",
        )}
      >
        {allLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("any")}
        className={cn(
          btn,
          "transition-colors",
          value === "any"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/30 text-muted-foreground hover:text-foreground",
        )}
      >
        {anyLabel}
      </button>
    </div>
  );
}

function groupSummaryLine(group: PlaybookConditionGroup): string {
  const preview = conditionsPreview(
    group.conditions,
    group.matchMode ?? "all",
  );
  return preview || group.label || "Empty rule";
}

function PreviewPanel({
  lines,
  alertTitle,
  compact,
}: {
  lines: string[];
  alertTitle: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);

  if (compact) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            When this fires → {alertTitle}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-primary/70 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open && lines.length > 0 && (
          <ul className="border-t border-primary/15 px-3 py-2 max-h-36 overflow-y-auto text-xs space-y-0.5 text-muted-foreground">
            {lines.map((line, index) => (
              <li
                key={index}
                className={cn(
                  line === "AND" || line === "OR"
                    ? "text-[10px] font-bold text-primary/50 py-0.5"
                    : "text-foreground/90",
                )}
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-primary/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        When this fires
      </p>
      {lines.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            IF
          </p>
          <ul className="space-y-2 border-l-2 border-primary/25 pl-4 ml-0.5 max-h-48 overflow-y-auto pr-1">
            {lines.map((line, index) =>
              line === "AND" || line === "OR" ? (
                <li key={index}>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary/70">
                    {line}
                  </span>
                </li>
              ) : (
                <li key={index} className="text-sm leading-relaxed text-foreground">
                  {line}
                </li>
              ),
            )}
          </ul>
          <p className="text-sm leading-relaxed pt-1 border-t border-primary/15">
            <span className="font-bold uppercase tracking-wide text-primary">
              THEN
            </span>{" "}
            <span className="text-foreground">→ {alertTitle}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add at least one signal condition below
        </p>
      )}
    </div>
  );
}

export function ConditionsBuilder({
  conditions,
  matchMode,
  onConditionsChange,
  onMatchModeChange,
  conditionGroups,
  groupMatchMode,
  onConditionGroupsChange,
  onGroupMatchModeChange,
  tags,
  disabled,
  alertTitle = "Alert",
}: Props) {
  const grouped = (conditionGroups?.length ?? 0) > 0;
  const manyGroups = (conditionGroups?.length ?? 0) > 4;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [sourcePick, setSourcePick] = useState<Record<string, SignalSource>>({});

  const previewPlaybook = useMemo(
    () =>
      grouped
        ? {
            conditions: [],
            matchMode: groupMatchMode ?? "any",
            conditionGroups,
            groupMatchMode: groupMatchMode ?? "any",
          }
        : { conditions, matchMode, conditionGroups: undefined },
    [grouped, conditions, matchMode, conditionGroups, groupMatchMode],
  );

  const previewLines = conditionsPreviewLinesForPlaybook(previewPlaybook);
  const topJoinLabel = grouped
    ? (groupMatchMode ?? "any") === "all"
      ? "AND"
      : "OR"
    : matchMode === "all"
      ? "AND"
      : "OR";

  if (grouped && conditionGroups && onConditionGroupsChange) {
    const expandedCount = conditionGroups.filter(
      (g) => expandedGroups[g.id],
    ).length;

    return (
      <div className="space-y-3">
        <PreviewPanel
          lines={previewLines}
          alertTitle={alertTitle}
          compact={manyGroups}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs font-medium shrink-0 text-muted-foreground">
              Between groups
            </Label>
            <MatchModeToggle
              value={groupMatchMode ?? "any"}
              disabled={disabled}
              onChange={(mode) => onGroupMatchModeChange?.(mode)}
              allLabel="ALL"
              anyLabel="ANY"
              compact
            />
            <span className="text-[11px] text-muted-foreground">
              {conditionGroups.length} rules · {topJoinLabel} between
            </span>
          </div>
          {manyGroups && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  for (const g of conditionGroups) next[g.id] = true;
                  setExpandedGroups(next);
                }}
              >
                Expand all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setExpandedGroups({})}
              >
                Collapse all
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border overflow-hidden max-h-[min(52vh,28rem)] overflow-y-auto">
          {conditionGroups.map((group, groupIndex) => {
            const innerJoin =
              (group.matchMode ?? "all") === "all" ? "and" : "or";
            const isOpen = expandedGroups[group.id] ?? false;
            const summary = groupSummaryLine(group);

            return (
              <div
                key={group.id}
                className={cn(
                  "border-b border-border/60 last:border-b-0",
                  isOpen ? "bg-muted/15" : "bg-card hover:bg-muted/10",
                )}
              >
                <div className="flex items-start gap-1 pr-1">
                  <button
                    type="button"
                    className="flex flex-1 items-start gap-2 px-2.5 py-2 text-left min-w-0"
                    onClick={() =>
                      setExpandedGroups((e) => ({
                        ...e,
                        [group.id]: !isOpen,
                      }))
                    }
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-bold text-primary tabular-nums">
                          R{groupIndex + 1}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {group.conditions.length} cond · {innerJoin.toUpperCase()}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          isOpen
                            ? "text-muted-foreground"
                            : "text-foreground/90 truncate",
                        )}
                        title={group.label ?? summary}
                      >
                        {isOpen
                          ? group.label || summary
                          : summary}
                      </p>
                      {!isOpen && group.conditions.length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {group.conditions.map(conditionRowSummary).join(` ${innerJoin} `)}
                        </p>
                      )}
                    </div>
                  </button>
                  {conditionGroups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      className="h-7 w-7 shrink-0 text-destructive/70 hover:text-destructive mt-1.5"
                      onClick={() =>
                        onConditionGroupsChange(
                          conditionGroups.filter((g) => g.id !== group.id),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <div className="px-3 pb-2.5 pt-0 space-y-2 border-t border-border/40">
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <MatchModeToggle
                        value={group.matchMode ?? "all"}
                        disabled={disabled}
                        onChange={(mode) =>
                          onConditionGroupsChange(
                            updateGroup(conditionGroups, group.id, {
                              matchMode: mode,
                            }),
                          )
                        }
                        allLabel="ALL"
                        anyLabel="ANY"
                        compact
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="h-7 text-xs"
                        onClick={() =>
                          onConditionGroupsChange(
                            updateGroup(conditionGroups, group.id, {
                              conditions: [
                                ...group.conditions,
                                createEmptyCondition(),
                              ],
                            }),
                          )
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        AND condition
                      </Button>
                    </div>

                    <div className="space-y-1 rounded-md border border-border/50 bg-background/50 px-2 py-2">
                      {group.conditions.map((cond, condIndex) => (
                        <ConditionRow
                          key={cond.id}
                          cond={cond}
                          index={condIndex}
                          total={group.conditions.length}
                          joinLabel={innerJoin}
                          tags={tags}
                          disabled={disabled}
                          compact
                          sourcePick={sourcePick[cond.id]}
                          expanded={expanded[cond.id]}
                          onSourcePick={(source) =>
                            setSourcePick((p) => ({ ...p, [cond.id]: source }))
                          }
                          onToggleExpanded={() =>
                            setExpanded((e) => ({
                              ...e,
                              [cond.id]: !e[cond.id],
                            }))
                          }
                          onUpdate={(patch) =>
                            onConditionGroupsChange(
                              updateGroupCondition(
                                conditionGroups,
                                group.id,
                                cond.id,
                                patch,
                              ),
                            )
                          }
                          onRemove={() =>
                            onConditionGroupsChange(
                              updateGroup(conditionGroups, group.id, {
                                conditions: group.conditions.filter(
                                  (c) => c.id !== cond.id,
                                ),
                              }),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {expandedCount > 0 && expandedCount < conditionGroups.length && (
          <p className="text-[11px] text-center text-muted-foreground">
            {expandedCount} of {conditionGroups.length} rules expanded
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full h-9 border-dashed border-primary/40 text-primary hover:bg-primary/10 text-sm"
          onClick={() =>
            onConditionGroupsChange([
              ...conditionGroups,
              createEmptyConditionGroup(),
            ])
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add OR rule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PreviewPanel lines={previewLines} alertTitle={alertTitle} />

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Match</Label>
        <MatchModeToggle
          value={matchMode}
          disabled={disabled}
          onChange={onMatchModeChange}
          allLabel="ALL conditions"
          anyLabel="ANY condition"
        />
      </div>

      <div className="space-y-3">
        {conditions.map((cond, index) => (
          <ConditionRow
            key={cond.id}
            cond={cond}
            index={index}
            total={conditions.length}
            joinLabel={matchMode === "all" ? "and" : "or"}
            tags={tags}
            disabled={disabled}
            sourcePick={sourcePick[cond.id]}
            expanded={expanded[cond.id]}
            onSourcePick={(source) =>
              setSourcePick((p) => ({ ...p, [cond.id]: source }))
            }
            onToggleExpanded={() =>
              setExpanded((e) => ({ ...e, [cond.id]: !e[cond.id] }))
            }
            onUpdate={(patch) =>
              onConditionsChange(updateCondition(conditions, cond.id, patch))
            }
            onRemove={() =>
              onConditionsChange(conditions.filter((c) => c.id !== cond.id))
            }
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="flex-1 h-12 border-dashed border-primary/40 text-primary hover:bg-primary/10"
          onClick={() =>
            onConditionsChange([...conditions, createEmptyCondition()])
          }
        >
          <Plus className="h-5 w-5 mr-2" />
          Add another condition
        </Button>
        {onConditionGroupsChange && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="flex-1 h-12 border-dashed"
            onClick={() => {
              onConditionGroupsChange([
                {
                  id: crypto.randomUUID(),
                  matchMode: "all",
                  conditions: conditions.length
                    ? conditions
                    : [createEmptyCondition()],
                },
              ]);
              onGroupMatchModeChange?.(matchMode);
              onConditionsChange([]);
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Use grouped rules (OR)
          </Button>
        )}
      </div>
    </div>
  );
}

export function playbookUsesGroups(playbook: {
  conditionGroups?: PlaybookConditionGroup[];
}): boolean {
  return usesConditionGroups(playbook);
}
