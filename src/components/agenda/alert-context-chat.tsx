"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Lock, Send, Sparkles, X } from "lucide-react";
import type { AlertAgendaItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function suggestedPrompts(alert: AlertAgendaItem): string[] {
  const batch = alert.batchContext?.batchId;
  const prompts = [
    "What triggered this alert?",
    "What should I do first?",
    "Summarize the action items for this alert.",
  ];
  if (batch) {
    prompts.push(`How does batch ${batch} relate to this alert?`);
  }
  if (alert.batchContext?.labSamples?.length) {
    prompts.push("Which lab values matter most here?");
  }
  return prompts.slice(0, 4);
}

function contextLabel(alert: AlertAgendaItem): string {
  const parts = [alert.playbookName, alert.alertTitle];
  if (alert.batchContext) {
    parts.push(
      `Batch ${alert.batchContext.batchId} · ${alert.batchContext.fermenter}`,
    );
  }
  return parts.join(" · ");
}

type AlertContextChatPanelProps = {
  alert: AlertAgendaItem;
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
};

export function AlertContextChatPanel({
  alert,
  onClose,
  className,
  embedded = false,
}: AlertContextChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [demoNote, setDemoNote] = useState<string | null>(null);

  const prompts = useMemo(() => suggestedPrompts(alert), [alert]);

  useEffect(() => {
    setDraft("");
    setDemoNote(null);
  }, [alert.id]);

  function handleDemoSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDemoNote(
      "Demo only — answers will be grounded in this alert's playbook, batch context, and action items in a future release.",
    );
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 h-full bg-muted/15",
        embedded && "border-l border-border/60",
        className,
      )}
    >
      <div className="shrink-0 px-5 py-4 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 font-normal text-xs">
                <Bot className="h-3.5 w-3.5" />
                Alert Copilot
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                Demo
              </Badge>
            </div>
            <p className="text-base font-semibold leading-snug">
              Ask about this alert
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              Context locked to{" "}
              <span className="text-foreground font-medium">
                {contextLabel(alert)}
              </span>
            </p>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground"
              onClick={onClose}
              aria-label="Close AI panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="rounded-2xl rounded-tl-md border border-border/80 bg-card px-4 py-3 text-sm leading-relaxed text-left shadow-sm max-w-[95%]">
            I can answer questions about{" "}
            <strong className="font-medium">{alert.playbookName}</strong> —
            triggered at{" "}
            {new Date(alert.triggeredAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
            . I won&apos;t use plant-wide data outside this alert&apos;s playbook,
            conditions, guidance, and batch snapshot.
          </div>
        </div>

        {demoNote && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">
            {demoNote}
          </p>
        )}
      </div>

      <div className="shrink-0 px-5 pb-2 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleDemoSubmit(p)}
            className="text-xs rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-colors text-left"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="shrink-0 flex gap-2 px-5 pb-5 pt-2 border-t border-border/60 bg-card/60"
        onSubmit={(e) => {
          e.preventDefault();
          handleDemoSubmit(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this alert…"
          className="h-10"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={!draft.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

type AlertChatTriggerProps = {
  className?: string;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "xs";
};

export function AlertChatTrigger({
  className,
  onClick,
  size = "sm",
}: AlertChatTriggerProps) {
  return (
    <button
      type="button"
      title="Ask about this alert (demo)"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0",
        size === "xs" ? "h-6 w-6" : "h-7 w-7",
        className,
      )}
    >
      <Bot className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />
    </button>
  );
}
