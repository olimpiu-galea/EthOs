"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Beaker,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock,
  Layers,
  ListChecks,
  MessageSquare,
  Shield,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import type { AlertAgendaItem, AlertLifecycle, AlertSeverity } from "@/lib/types";
import { ALERT_DURATION_MS } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { useAuditStore } from "@/stores/audit-store";
import { usePlaybookFeedbackStore } from "@/stores/playbook-feedback-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { resolveAlertTeamIds, teamNamesForIds } from "@/lib/teams";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertContextChatModal } from "@/components/agenda/alert-context-chat";

const SEVERITY_THEME: Record<
  AlertSeverity,
  { ring: string; glow: string; badge: "danger" | "warning" | "secondary" }
> = {
  critical: {
    ring: "from-rose-500/40 via-rose-500/10 to-transparent",
    glow: "shadow-rose-500/20",
    badge: "danger",
  },
  warning: {
    ring: "from-amber-500/40 via-amber-500/10 to-transparent",
    glow: "shadow-amber-500/20",
    badge: "warning",
  },
  info: {
    ring: "from-primary/40 via-primary/10 to-transparent",
    glow: "shadow-primary/20",
    badge: "secondary",
  },
};

const LIFECYCLE_LABELS: Record<AlertLifecycle, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatElapsed(ms: number) {
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return "< 1 min ago";
  if (totalMin < 60) return `${totalMin} min ago`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m ago`;
}

function formatCommentTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type AlertDetailModalProps = {
  alert: AlertAgendaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AlertDetailModal({
  alert: alertProp,
  open,
  onOpenChange,
}: AlertDetailModalProps) {
  const user = useAuthStore((s) => s.user);
  const teams = useSettingsStore((s) => s.teams);
  const alertId = alertProp?.id;
  const liveAlert = useAlertHistoryStore((s) =>
    alertId ? s.items.find((i) => i.id === alertId) : undefined,
  );
  const alert = liveAlert ?? alertProp;
  const toggleActionItem = useAlertHistoryStore((s) => s.toggleActionItem);
  const setLifecycle = useAlertHistoryStore((s) => s.setLifecycle);
  const escalate = useAlertHistoryStore((s) => s.escalate);
  const addComment = useAlertHistoryStore((s) => s.addComment);
  const auditEvents = useAuditStore((s) => s.forAlert);
  const addFeedback = usePlaybookFeedbackStore((s) => s.addFeedback);
  const [commentDraft, setCommentDraft] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    setCommentDraft("");
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [open, alertId]);

  const actionItems = alert?.actionItems ?? [];
  const guidance = alert?.guidance ?? [];
  const comments = alert?.comments ?? [];
  const completedIds = alert?.completedActionIds ?? [];
  const lifecycle = alert?.lifecycle ?? "new";
  const actionDone = completedIds.length;
  const actionTotal = actionItems.length;

  const progress = useMemo(() => {
    if (actionTotal === 0) return 0;
    return Math.round((actionDone / actionTotal) * 100);
  }, [actionDone, actionTotal]);

  const theme = alert ? SEVERITY_THEME[alert.severity] : SEVERITY_THEME.warning;
  const allDone = actionTotal > 0 && actionDone === actionTotal;
  const endsAt = alert
    ? alert.triggeredAt + (alert.durationMs ?? ALERT_DURATION_MS)
    : 0;
  const timeline = alert ? auditEvents(alert.id) : [];
  const actor = user?.name ?? "User";
  const teamNames = alert
    ? teamNamesForIds(resolveAlertTeamIds(alert, teams), teams)
    : "";

  if (!alert) return null;

  const isClosed = lifecycle === "resolved" || lifecycle === "false_alarm";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-6xl w-[min(96vw,72rem)] max-h-[92vh] border-border/80 bg-card/95 p-0 gap-0 overflow-hidden backdrop-blur-xl shadow-2xl",
          theme.glow,
        )}
      >
        <div
          className={cn(
            "relative px-6 pt-5 pb-4 border-b border-border/60 bg-gradient-to-br shrink-0",
            theme.ring,
          )}
        >
          <Button
            type="button"
            size="sm"
            className={cn(
              "absolute top-4 right-14 z-20 gap-2 h-9 px-4 text-xs font-semibold",
              "bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground",
              "shadow-lg shadow-primary/30 ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
              "hover:brightness-110 hover:shadow-primary/40 transition-all",
            )}
            onClick={() => setChatOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            Ask about this alert
          </Button>
          <DialogHeader className="relative space-y-2.5 text-left pr-36">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={theme.badge} className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {alert.alertTitle}
              </Badge>
              <Badge variant="outline">{LIFECYCLE_LABELS[lifecycle]}</Badge>
              {(alert.escalationLevel ?? 0) > 0 && (
                <Badge variant="warning" className="gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Escalated L{alert.escalationLevel}
                </Badge>
              )}
              {alert.assignedRole && (
                <Badge variant="secondary">
                  → {ROLE_LABELS[alert.assignedRole]}
                </Badge>
              )}
              {teamNames && teamNames !== "Unassigned" && (
                <Badge variant="outline" className="text-xs">
                  {teamNames}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
              {alert.playbookName}
            </DialogTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {formatTime(alert.triggeredAt)} · slot until {formatTime(endsAt)} ·{" "}
                {formatElapsed(now - alert.triggeredAt)}
              </span>
            </div>
            <p className="font-mono text-xs text-primary/90">
              IF {alert.conditionsSummary}
            </p>
          </DialogHeader>
        </div>

        <div className="grid lg:grid-cols-5 gap-0 overflow-y-auto max-h-[calc(92vh-9rem)]">
          <div className="lg:col-span-2 p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-border/60">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Situation
              </p>
              <p className="text-base leading-relaxed">{alert.alertMessage}</p>
            </div>

            {alert.batchContext && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  Batch context
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Batch</p>
                    <p className="font-medium">{alert.batchContext.batchId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Fermenter</p>
                    <p className="font-medium">{alert.batchContext.fermenter}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phase</p>
                    <p className="font-medium">{alert.batchContext.phaseLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Age</p>
                    <p className="font-medium">{alert.batchContext.batchAgeH}h</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Beaker className="h-3 w-3" /> Recent lab
                  </p>
                  {alert.batchContext.labSamples.map((s) => (
                    <p key={s.label} className="text-xs">
                      {s.label}: {s.value}
                    </p>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  Open batch workspace
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lifecycle
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["acknowledged", "Acknowledge"],
                    ["in_progress", "In progress"],
                    ["resolved", "Resolve"],
                    ["false_alarm", "False alarm"],
                  ] as const
                ).map(([state, label]) => (
                  <Button
                    key={state}
                    size="sm"
                    variant={lifecycle === state ? "default" : "outline"}
                    disabled={isClosed && state !== lifecycle}
                    onClick={() => setLifecycle(alert.id, state, actor)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {!isClosed && alert.severity === "critical" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => escalate(alert.id, actor)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Escalate to supervisor
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Response progress
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {actionDone}/{actionTotal} · {progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    allDone ? "bg-success" : "bg-primary",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Playbook feedback
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() =>
                    addFeedback({
                      alertId: alert.id,
                      playbookId: alert.playbookId,
                      rating: "helpful",
                      actor,
                    })
                  }
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() =>
                    addFeedback({
                      alertId: alert.id,
                      playbookId: alert.playbookId,
                      rating: "noise",
                      actor,
                    })
                  }
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Noise
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-xs px-2"
                  onClick={() =>
                    addFeedback({
                      alertId: alert.id,
                      playbookId: alert.playbookId,
                      rating: "wrong_threshold",
                      actor,
                    })
                  }
                >
                  <Wrench className="h-3.5 w-3.5" /> Threshold
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 p-5 space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                Action items
                {actionTotal > 0 && (
                  <span className="normal-case font-medium text-foreground/80">
                    ({actionDone}/{actionTotal})
                  </span>
                )}
              </p>
              <ul className="space-y-2">
                {actionItems.map((item, index) => {
                  const done = completedIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleActionItem(alert.id, item.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-3.5 transition-all",
                          done
                            ? "border-success/35 bg-success/5"
                            : "border-border/80 hover:border-primary/40",
                        )}
                      >
                        <div className="flex gap-3">
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                              done
                                ? "border-success bg-success text-success-foreground"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <div>
                            <p
                              className={cn(
                                "font-medium",
                                done && "line-through text-muted-foreground",
                              )}
                            >
                              {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Guidance
              </p>
              <div className="rounded-xl border p-4 space-y-3">
                {guidance.map((step, i) => (
                  <div key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {timeline.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Audit trail
                </p>
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2 max-h-36 overflow-y-auto">
                  {timeline.map((e) => (
                    <div key={e.id} className="text-xs flex gap-2">
                      <span className="text-muted-foreground shrink-0">
                        {formatTime(e.at)}
                      </span>
                      <span>
                        <strong>{e.actor}</strong> — {e.action}
                        {e.note ? `: ${e.note}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Comments
              </p>

              {comments.length > 0 && (
                <ul className="space-y-2">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1"
                    >
                      <p className="text-sm leading-relaxed">{comment.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.author} · {formatCommentTime(comment.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-xl border border-border/80 p-4 space-y-3">
                <label htmlFor="alert-comment" className="text-sm font-medium">
                  Leave a comment
                </label>
                <textarea
                  id="alert-comment"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add context for the next shift or supervisor…"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[72px]"
                />
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={!commentDraft.trim()}
                  onClick={() => {
                    addComment(alert.id, commentDraft, actor);
                    setCommentDraft("");
                  }}
                >
                  Post comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <AlertContextChatModal
      alert={alert}
      open={chatOpen}
      onOpenChange={setChatOpen}
    />
    </>
  );
}
