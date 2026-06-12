"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type OperationsSuiteToggleProps = {
  className?: string;
  variant?: "sidebar" | "inline";
};

export function OperationsSuiteToggle({
  className,
  variant = "sidebar",
}: OperationsSuiteToggleProps) {
  const operationsSuiteEnabled = useSettingsStore(
    (s) => s.operationsSuiteEnabled,
  );
  const setOperationsSuiteEnabled = useSettingsStore(
    (s) => s.setOperationsSuiteEnabled,
  );

  const switchEl = (
    <Switch
      checked={operationsSuiteEnabled}
      onCheckedChange={setOperationsSuiteEnabled}
      aria-label={
        operationsSuiteEnabled ? "Phrase 2 active" : "Phrase 2 inactive"
      }
      className={cn(
        "shrink-0 rounded-full border-[3px] transition-colors",
        variant === "inline" ? "h-5 w-9" : "h-6 w-11",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        "data-[state=checked]:shadow-[0_0_0_2px_hsl(var(--primary)/0.35)]",
        "data-[state=unchecked]:bg-muted/50 data-[state=unchecked]:border-foreground/70",
        "data-[state=unchecked]:shadow-[0_0_0_1px_hsl(var(--foreground)/0.25)]",
      )}
      thumbClassName={cn(
        "border border-foreground/25 bg-background shadow-md",
        variant === "inline"
          ? "h-3.5 w-3.5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
          : "h-[18px] w-[18px] data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
      )}
    />
  );

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5",
          operationsSuiteEnabled
            ? "border-primary/35 bg-primary/5"
            : "border-foreground/40 bg-muted/25",
          className,
        )}
        title={
          operationsSuiteEnabled
            ? "Extras enabled — batches, margin desk, inventory"
            : "Extras disabled"
        }
      >
        <div className="min-w-0 hidden sm:block">
          <p className="text-[11px] font-medium leading-none">Phrase 2</p>
          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
            {operationsSuiteEnabled ? "On" : "Off"}
          </p>
        </div>
        {switchEl}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 pt-2.5 mt-2 px-1.5 py-1.5 rounded-md",
        operationsSuiteEnabled
          ? "border-t border-primary/20"
          : "border-2 border-foreground/45 bg-muted/20",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight">Phrase 2</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {operationsSuiteEnabled ? "Active" : "Inactive"}
        </p>
      </div>
      {switchEl}
    </div>
  );
}
