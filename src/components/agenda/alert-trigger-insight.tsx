"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";
import type { AlertAgendaItem } from "@/lib/types";
import {
  buildAlertTriggerInsight,
  formatExpectedSublabel,
  type AlertInsightComparison,
  type AlertInsightContext,
} from "@/lib/alert-trigger-insight";
import { cn } from "@/lib/utils";

function ActualCard({ comparison }: { comparison: AlertInsightComparison }) {
  const tone = comparison.tone ?? "warning";
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 text-center min-w-0",
        tone === "critical"
          ? "border-critical/40 bg-critical-muted/60 [&_.metric-value]:text-critical"
          : "border-amber-500/35 bg-amber-500/10 [&_.metric-value]:text-amber-800 dark:[&_.metric-value]:text-amber-200",
      )}
    >
      <p className="metric-value text-3xl font-bold tabular-nums leading-none tracking-tight">
        {comparison.actualValue}
        {comparison.actualUnit && (
          <span className="text-base font-semibold ml-1 opacity-90">
            {comparison.actualUnit}
          </span>
        )}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2.5">
        {comparison.actualLabel}
      </p>
      {comparison.expectedValue !== "—" && (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
          {formatExpectedSublabel(comparison)}
        </p>
      )}
    </div>
  );
}

function ContextCard({ context }: { context: AlertInsightContext }) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4 text-center min-w-0">
      <p className="metric-value text-3xl font-bold tabular-nums leading-none tracking-tight text-foreground">
        {context.value}
        {context.unit && (
          <span className="text-base font-semibold ml-1 text-muted-foreground">
            {context.unit}
          </span>
        )}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2.5">
        {context.label}
      </p>
      {context.sublabel && (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
          {context.sublabel}
        </p>
      )}
    </div>
  );
}

export function AlertTriggerInsightPanel({
  alert,
}: {
  alert: AlertAgendaItem;
}) {
  const insight = useMemo(() => buildAlertTriggerInsight(alert), [alert]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Why this fired
        </p>
      </div>

      <p className="text-sm font-semibold leading-snug text-foreground">
        {insight.headline}
      </p>

      {insight.comparison && (
        <div
          className={cn(
            "grid gap-2",
            insight.context ? "grid-cols-2" : "grid-cols-1 max-w-[50%]",
          )}
        >
          <ActualCard comparison={insight.comparison} />
          {insight.context && <ContextCard context={insight.context} />}
        </div>
      )}

      {insight.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {insight.chips.map((chip) => (
            <span
              key={`${chip.label}-${chip.value}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 px-2 py-1 text-[11px]"
            >
              <span className="text-muted-foreground">{chip.label}</span>
              <span className="font-medium text-foreground">{chip.value}</span>
            </span>
          ))}
        </div>
      )}

      {insight.rule && (
        <p className="text-[11px] font-mono text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5 leading-relaxed">
          IF {insight.rule}
        </p>
      )}
    </div>
  );
}
