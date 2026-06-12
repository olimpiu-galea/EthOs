"use client";

import { ChevronDown, Link2 } from "lucide-react";
import type { AlertAgendaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_BADGE = {
  critical: "danger" as const,
  warning: "warning" as const,
  info: "secondary" as const,
};

type AlertLinkMultiSelectProps = {
  alerts: AlertAgendaItem[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  className?: string;
};

export function AlertLinkMultiSelect({
  alerts,
  selectedIds,
  onChange,
  className,
}: AlertLinkMultiSelectProps) {
  const count = selectedIds.size;

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function selectAll() {
    onChange(new Set(alerts.map((a) => a.id)));
  }

  function clearAll() {
    onChange(new Set());
  }

  const triggerLabel =
    count === 0
      ? "No alerts linked"
      : count === 1
        ? "1 alert linked"
        : `${count} alerts linked`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5" />
        Link alerts (optional)
      </Label>
      <details className="group">
        <summary
          className={cn(
            "flex h-10 w-full list-none cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              count === 0 && "text-muted-foreground",
            )}
          >
            {triggerLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-1 rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {alerts.length} on agenda
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={selectAll}
                disabled={alerts.length === 0}
              >
                All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearAll}
                disabled={count === 0}
              >
                None
              </Button>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No agenda alerts available.
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto p-2 space-y-1">
              {alerts.map((a) => {
                const checked = selectedIds.has(a.id);
                return (
                  <li key={a.id}>
                    <label
                      className={cn(
                        "flex gap-2.5 rounded-md border px-2.5 py-2 cursor-pointer transition-colors",
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(a.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <Badge
                            variant={SEVERITY_BADGE[a.severity]}
                            className="text-[9px] h-4 px-1"
                          >
                            {a.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(a.triggeredAt).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </span>
                        <span className="text-xs font-medium block truncate">
                          {a.alertTitle}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {a.playbookName}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
