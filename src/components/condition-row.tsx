"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { canonicalSignalLabel } from "@/lib/ferm-signals";
import type { DcsTagWithKey, PlaybookCondition, Rule, SignalSource } from "@/lib/types";
import {
  availableSourcesForRules,
  sourceForRule,
  tagsForSource,
} from "@/lib/condition-helpers";
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

type Props = {
  cond: PlaybookCondition;
  index: number;
  total: number;
  joinLabel?: string;
  tags: DcsTagWithKey[];
  disabled?: boolean;
  sourcePick?: SignalSource;
  expanded?: boolean;
  onSourcePick: (source: SignalSource) => void;
  onToggleExpanded: () => void;
  onUpdate: (patch: Partial<Rule>) => void;
  onRemove?: () => void;
  title?: string;
  compact?: boolean;
};

function AdvancedFields({
  r,
  disabled,
  onUpdate,
  compact,
}: {
  r: Rule;
  disabled?: boolean;
  onUpdate: (patch: Partial<Rule>) => void;
  compact?: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className={compact ? "text-[10px]" : "text-xs"}>Over</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            placeholder="—"
            disabled={disabled}
            className={compact ? "h-8 text-xs" : undefined}
            value={r.duration?.value ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                const next = { ...r };
                delete next.duration;
                onUpdate(next);
                return;
              }
              onUpdate({
                duration: {
                  value: Number(val),
                  unit: r.duration?.unit ?? "h",
                },
              });
            }}
          />
          <Select
            disabled={disabled}
            value={r.duration?.unit ?? "h"}
            onValueChange={(unit) => {
              if (!r.duration) return;
              onUpdate({
                duration: {
                  ...r.duration,
                  unit: unit as "min" | "h",
                },
              });
            }}
          >
            <SelectTrigger className={cn(compact ? "h-8 w-16 text-xs" : "w-20")}>
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
        <Label className={compact ? "text-[10px]" : "text-xs"}>Calculate as</Label>
        <Select
          disabled={disabled}
          value={r.aggregation ?? "instant"}
          onValueChange={(v) =>
            onUpdate({ aggregation: v as Rule["aggregation"] })
          }
        >
          <SelectTrigger className={compact ? "h-8 text-xs" : undefined}>
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
    </>
  );
}

export function ConditionRow({
  cond,
  index,
  total,
  joinLabel,
  tags,
  disabled,
  sourcePick,
  expanded = false,
  onSourcePick,
  onToggleExpanded,
  onUpdate,
  onRemove,
  title,
  compact = false,
}: Props) {
  const r = cond.rule;
  const availableSources = availableSourcesForRules(tags, [r]);
  const activeSource = sourceForRule(r, tags, sourcePick, availableSources);
  const sourceTags = tagsForSource(tags, r, activeSource);
  const tag = sourceTags.find((t) => t.id === r.signalId);

  if (compact) {
    return (
      <div className="space-y-0">
        {joinLabel && index > 0 && (
          <div className="py-0.5 pl-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/55">
              {joinLabel}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 group">
          <div className="grid flex-1 grid-cols-[minmax(5rem,0.65fr)_minmax(0,2fr)_3.25rem_4.25rem] gap-1.5 items-center min-w-0">
            <Select
              disabled={disabled || availableSources.length === 0}
              value={activeSource}
              onValueChange={(src) => {
                onSourcePick(src as SignalSource);
                onUpdate({ signalId: "", displayLabel: undefined });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              disabled={disabled || (sourceTags.length === 0 && !r.signalId)}
              value={r.signalId || undefined}
              onValueChange={(signalId) => {
                const t = sourceTags.find((x) => x.id === signalId);
                onUpdate({
                  signalId,
                  displayLabel: t?.displayLabel,
                  threshold:
                    t && typeof t.value === "number"
                      ? Number(t.value)
                      : r.threshold,
                });
              }}
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue placeholder="Signal" />
              </SelectTrigger>
              <SelectContent>
                {sourceTags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.displayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              disabled={disabled}
              value={r.operator}
              onValueChange={(op) =>
                onUpdate({ operator: op as Rule["operator"] })
              }
            >
              <SelectTrigger className="h-8 text-xs font-mono px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([">", "<", ">=", "<=", "==", "!="] as const).map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              disabled={disabled}
              className="h-8 text-sm font-semibold tabular-nums"
              value={r.threshold}
              title={tag?.unit ? `Unit: ${tag.unit}` : undefined}
              onChange={(e) =>
                onUpdate({ threshold: Number(e.target.value) })
              }
            />
          </div>
          {onRemove && total > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="h-7 w-7 shrink-0 text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {expanded ? (
          <div className="grid gap-2 sm:grid-cols-3 pt-2 pb-1 border-t border-border/40 mt-1.5">
            <AdvancedFields
              r={r}
              disabled={disabled}
              onUpdate={onUpdate}
              compact
            />
          </div>
        ) : (
          <button
            type="button"
            className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground py-0.5"
            onClick={onToggleExpanded}
          >
            + time window
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-primary">
          {title ?? `Condition ${index + 1}`}
        </span>
        {onRemove && total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="text-destructive hover:text-destructive h-8"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-12 items-end">
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Source</Label>
          <Select
            disabled={disabled || availableSources.length === 0}
            value={activeSource}
            onValueChange={(src) => {
              onSourcePick(src as SignalSource);
              onUpdate({ signalId: "", displayLabel: undefined });
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {availableSources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-5 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Signal</Label>
          <Select
            disabled={disabled || (sourceTags.length === 0 && !r.signalId)}
            value={r.signalId || undefined}
            onValueChange={(signalId) => {
              const t = sourceTags.find((x) => x.id === signalId);
              onUpdate({
                signalId,
                displayLabel: t?.displayLabel,
                threshold:
                  t && typeof t.value === "number"
                    ? Number(t.value)
                    : r.threshold,
              });
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose a tag…" />
            </SelectTrigger>
            <SelectContent>
              {sourceTags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
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
              onUpdate({ operator: op as Rule["operator"] })
            }
          >
            <SelectTrigger className="h-11 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([">", "<", ">=", "<=", "==", "!="] as const).map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
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
              onUpdate({ threshold: Number(e.target.value) })
            }
          />
        </div>
        <div className="sm:col-span-1 flex justify-end pb-1">
          {joinLabel && index < total - 1 && (
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {joinLabel}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={onToggleExpanded}
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Time window & averaging (optional)
      </button>

      {expanded && (
        <div className="grid gap-3 sm:grid-cols-3 pt-1 border-t border-border/60">
          <AdvancedFields r={r} disabled={disabled} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export function conditionRowSummary(cond: PlaybookCondition): string {
  const r = cond.rule;
  if (!r.signalId) return "Empty condition";
  return `${canonicalSignalLabel(r)} ${r.operator} ${r.threshold}`;
}
