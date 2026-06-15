"use client";

import { useRef } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  clampDateKey,
  formatAgendaDateLabel,
  shiftDateKey,
} from "@/lib/agenda-time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  todayKey: string;
  onChange: (dateKey: string) => void;
  /** Earliest selectable day (inclusive). Omit for unrestricted history. */
  minDateKey?: string;
  /** Latest selectable day (inclusive). Omit for unrestricted future dates. */
  maxDateKey?: string;
  /** When true, copy reflects a 2-day window (today + yesterday). */
  limitedRange?: boolean;
  className?: string;
};

export function AgendaDatePicker({
  value,
  todayKey,
  onChange,
  minDateKey,
  maxDateKey,
  limitedRange = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isToday = value === todayKey;
  const isFuture = value > todayKey;
  const canGoNext = !maxDateKey || value < maxDateKey;
  const canGoPrev = !minDateKey || value > minDateKey;

  const shortLabel = (() => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  const subLabel = (() => {
    if (isToday) return "Today · live timeline";
    if (isFuture) return "Upcoming · planned alerts";
    if (limitedRange && minDateKey && value === minDateKey) {
      return "Yesterday · previous shift";
    }
    return "Historical view";
  })();

  function setDate(next: string) {
    onChange(clampDateKey(next, minDateKey, maxDateKey));
  }

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  }

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-primary/35 max-lg:w-full",
        "bg-gradient-to-r from-primary/[0.08] via-background/80 to-background/60",
        "p-1 shadow-[0_0_24px_-12px_hsl(var(--primary)/0.35)]",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canGoPrev}
        className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30"
        onClick={() => setDate(shiftDateKey(value, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-[1.15rem] w-[1.15rem]" />
      </Button>

      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "flex min-w-[13.25rem] max-lg:min-w-0 max-lg:flex-1 items-center gap-2.5 rounded-lg px-3 py-2",
          "border border-primary/20 bg-background/50 hover:bg-primary/5",
          "hover:border-primary/35 transition-colors text-left",
        )}
        aria-label={`Selected date: ${formatAgendaDateLabel(value)}. Open calendar`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25">
          <CalendarDays className="h-[1.15rem] w-[1.15rem] text-primary" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight truncate">
            {shortLabel}
          </span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">
            {subLabel}
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="date"
        value={value}
        min={minDateKey}
        max={maxDateKey}
        onChange={(e) => {
          if (e.target.value) setDate(e.target.value);
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canGoNext}
        className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30"
        onClick={() => setDate(shiftDateKey(value, 1))}
        aria-label="Next day"
      >
        <ChevronRight className="h-[1.15rem] w-[1.15rem]" />
      </Button>

      <div className="h-8 w-px bg-border/80 mx-0.5 hidden sm:block" />

      <Button
        type="button"
        variant={isToday ? "secondary" : "outline"}
        size="sm"
        disabled={isToday}
        className={cn(
          "h-10 gap-1.5 px-3.5 text-[13px] font-medium rounded-lg shrink-0",
          isToday && "opacity-80",
        )}
        onClick={() => setDate(todayKey)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Today
      </Button>
    </div>
  );
}
