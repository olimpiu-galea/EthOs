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
        "shrink-0 rounded-full border-2 transition-colors",
        variant === "inline" ? "h-5 w-9" : "h-6 w-11",
        variant === "sidebar"
          ? "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=unchecked]:bg-sidebar-accent data-[state=unchecked]:border-sidebar-border"
          : "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
      )}
      thumbClassName={cn(
        "border shadow-md",
        variant === "sidebar"
          ? "border-sidebar-border bg-white data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
          : "border-border bg-background data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
        variant === "inline" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]",
      )}
    />
  );

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5",
          operationsSuiteEnabled
            ? "border-border bg-muted/50"
            : "border-border bg-card",
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
        "flex items-center justify-between gap-3 pt-2.5 mt-2 px-2 py-2 rounded-lg border border-sidebar-border",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight text-sidebar-foreground">
          Phrase 2
        </p>
        <p className="text-[10px] text-sidebar-muted leading-tight mt-0.5">
          {operationsSuiteEnabled ? "Active" : "Inactive"}
        </p>
      </div>
      {switchEl}
    </div>
  );
}
