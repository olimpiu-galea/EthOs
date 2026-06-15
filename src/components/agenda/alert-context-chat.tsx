"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Lock, Send, Sparkles } from "lucide-react";
import type { AlertAgendaItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type AlertContextChatModalProps = {
  alert: AlertAgendaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AlertContextChatModal({
  alert,
  open,
  onOpenChange,
}: AlertContextChatModalProps) {
  const [draft, setDraft] = useState("");
  const [demoNote, setDemoNote] = useState<string | null>(null);

  const prompts = useMemo(
    () => (alert ? suggestedPrompts(alert) : []),
    [alert],
  );

  useEffect(() => {
    if (!open) {
      setDraft("");
      setDemoNote(null);
    }
  }, [open, alert?.id]);

  if (!alert) return null;

  function handleDemoSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDemoNote(
      "Demo only — answers will be grounded in this alert's playbook, batch context, and action items in a future release.",
    );
    setDraft("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[min(96vw,28rem)] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/60 text-left space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Bot className="h-3 w-3" />
              Alert Copilot
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Lock className="h-3 w-3" />
              Demo
            </Badge>
          </div>
          <DialogTitle className="text-base font-semibold leading-snug pr-6">
            Ask about this alert only
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Context locked to:{" "}
            <span className="text-foreground font-medium">{contextLabel(alert)}</span>
          </p>
        </DialogHeader>

        <div className="px-4 py-3 space-y-3 bg-muted/20 max-h-[22rem] overflow-y-auto">
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-border/80 bg-card px-3 py-2.5 text-xs leading-relaxed text-left shadow-sm">
              I can answer questions about{" "}
              <strong className="font-medium">{alert.playbookName}</strong> —
              triggered at{" "}
              {new Date(alert.triggeredAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              . I won&apos;t use plant-wide data outside this alert&apos;s
              playbook, conditions, guidance, and batch snapshot.
            </div>
          </div>

          {demoNote && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              {demoNote}
            </p>
          )}
        </div>

        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleDemoSubmit(p)}
              className="text-[10px] rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2 px-4 pb-4 pt-1 border-t border-border/60"
          onSubmit={(e) => {
            e.preventDefault();
            handleDemoSubmit(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this alert…"
            className="h-9 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!draft.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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
