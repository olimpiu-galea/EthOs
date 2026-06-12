"use client";

import { Radio } from "lucide-react";
import type { CommoditySignalSnapshot } from "@/lib/types";
import { formatSnapshotValue } from "@/lib/commodity-signals";
import { cn } from "@/lib/utils";

type CommoditySnapshotPanelProps = {
  snapshot: CommoditySignalSnapshot[];
  compact?: boolean;
  className?: string;
};

export function CommoditySnapshotPanel({
  snapshot,
  compact,
  className,
}: CommoditySnapshotPanelProps) {
  if (!snapshot.length) return null;

  const capturedAt = snapshot[0]?.capturedAt;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Radio className="h-3.5 w-3.5 text-primary" />
        <p
          className={cn(
            "font-semibold uppercase tracking-wider text-foreground",
            compact ? "text-[10px]" : "text-sm",
          )}
        >
          Signals at report time
        </p>
        {capturedAt && (
          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
            {new Date(capturedAt).toLocaleString()}
          </span>
        )}
      </div>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {snapshot.map((s) => (
          <div
            key={s.tag}
            className={cn(
              "rounded-lg border border-primary/20 bg-primary/5",
              compact ? "px-2 py-1.5" : "px-3 py-2",
            )}
          >
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {s.tag}
            </p>
            <p className={cn("font-medium truncate", compact ? "text-[11px]" : "text-sm")}>
              {s.displayLabel}
            </p>
            <p
              className={cn(
                "font-bold tabular-nums text-primary",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {formatSnapshotValue(s)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
