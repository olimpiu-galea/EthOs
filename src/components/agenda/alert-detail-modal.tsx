"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  ListChecks,
  Shield,
  Sparkles,
} from "lucide-react";
import type { AlertAgendaItem, AlertSeverity } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionItem = {
  id: string;
  title: string;
  detail: string;
  lane: "now" | "next" | "verify";
  minutes: number;
};

type GuidancePhase = {
  id: string;
  label: string;
  headline: string;
  steps: { title: string; body: string }[];
};

/** Shared operator response — same for all alerts in demo */
const ACTION_ITEMS: ActionItem[] = [
  {
    id: "ack",
    title: "Acknowledge at panel",
    detail: "Confirm the alarm on DCS and note the exact timestamp in the shift log.",
    lane: "now",
    minutes: 1,
  },
  {
    id: "verify",
    title: "Verify live reading",
    detail:
      "Cross-check the triggering tag against the historian trend — rule out a bad transmitter or stale value.",
    lane: "now",
    minutes: 3,
  },
  {
    id: "stabilize",
    title: "Apply first corrective step",
    detail:
      "Follow the unit SOP: adjust setpoint, open/close valve, or call field if the reading is confirmed out of range.",
    lane: "next",
    minutes: 8,
  },
  {
    id: "escalate",
    title: "Escalate if not normal in 15 min",
    detail:
      "Notify shift lead and maintenance if the condition persists after the first intervention.",
    lane: "next",
    minutes: 2,
  },
  {
    id: "document",
    title: "Log deviation & close loop",
    detail:
      "Record root cause, actions taken, and return-to-normal time for the batch record / DOR.",
    lane: "verify",
    minutes: 5,
  },
];

const GUIDANCE_PHASES: GuidancePhase[] = [
  {
    id: "immediate",
    label: "T+0",
    headline: "Immediate — confirm reality",
    steps: [
      {
        title: "Read the full faceplate",
        body: "Check PV, SP, mode, and interlocks. A single tag rarely tells the whole story.",
      },
      {
        title: "Scan adjacent tags",
        body: "Temperature excursions often pair with flow or level changes — look one unit upstream/downstream.",
      },
    ],
  },
  {
    id: "stabilize",
    label: "T+5",
    headline: "Stabilize — smallest safe move",
    steps: [
      {
        title: "One change at a time",
        body: "Avoid stacking manual overrides. Wait 2–3 minutes between adjustments to see the effect.",
      },
      {
        title: "Prefer automatic over manual",
        body: "Return loops to AUTO/CAS as soon as the process is stable; document any time spent in MAN.",
      },
    ],
  },
  {
    id: "verify",
    label: "T+15",
    headline: "Verify — prove it held",
    steps: [
      {
        title: "Watch the trend, not the number",
        body: "Confirm the signal stays inside limits for at least one full controller scan cycle.",
      },
      {
        title: "Clear only when confident",
        body: "If the playbook re-fires within cooldown, treat it as unresolved — do not silence and walk away.",
      },
    ],
  },
];

const LANE_META = {
  now: { label: "Now", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  next: { label: "Next", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  verify: { label: "Verify", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
} as const;

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

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

type AlertDetailModalProps = {
  alert: AlertAgendaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AlertDetailModal({
  alert,
  open,
  onOpenChange,
}: AlertDetailModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activePhase, setActivePhase] = useState(GUIDANCE_PHASES[0].id);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    setChecked(new Set());
    setActivePhase(GUIDANCE_PHASES[0].id);
    setCopied(false);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [open, alert?.id]);

  const progress = useMemo(() => {
    if (ACTION_ITEMS.length === 0) return 0;
    return Math.round((checked.size / ACTION_ITEMS.length) * 100);
  }, [checked]);

  const theme = alert ? SEVERITY_THEME[alert.severity] : SEVERITY_THEME.warning;
  const activeGuidance =
    GUIDANCE_PHASES.find((p) => p.id === activePhase) ?? GUIDANCE_PHASES[0];
  const allDone = progress === 100;

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyBrief = async () => {
    if (!alert) return;
    const lines = [
      `[${alert.alertTitle}] ${alert.playbookName}`,
      `Triggered: ${formatTime(alert.triggeredAt)}`,
      `Message: ${alert.alertMessage}`,
      `Condition: IF ${alert.conditionsSummary}`,
      "",
      "Actions:",
      ...ACTION_ITEMS.map(
        (a, i) => `${i + 1}. [${LANE_META[a.lane].label}] ${a.title}`,
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl border-border/80 bg-card/95 p-0 gap-0 overflow-hidden backdrop-blur-xl",
          "shadow-2xl",
          theme.glow,
        )}
      >
        <div
          className={cn(
            "relative px-6 pt-6 pb-5 border-b border-border/60",
            "bg-gradient-to-br",
            theme.ring,
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <DialogHeader className="relative space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={theme.badge} className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {alert.alertTitle}
              </Badge>
              <Badge
                variant={alert.status === "completed" ? "success" : "warning"}
              >
                {alert.status === "completed" ? "Completed" : "Active"}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {alert.playbookName}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight pr-8">
              Incident response brief
            </DialogTitle>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Triggered {formatTime(alert.triggeredAt)}
                <span className="text-foreground/70">
                  · {formatElapsed(now - alert.triggeredAt)}
                </span>
              </span>
              <span className="font-mono text-xs text-primary/90">
                IF {alert.conditionsSummary}
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="grid lg:grid-cols-5 gap-0 max-h-[min(70vh,640px)] overflow-y-auto">
          {/* Message + progress */}
          <div className="lg:col-span-2 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-border/60">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Situation
              </p>
              <p className="text-base leading-relaxed text-foreground/95">
                {alert.alertMessage}
              </p>
              <p className="text-sm text-muted-foreground">
                Playbook{" "}
                <strong className="text-foreground">{alert.playbookName}</strong>{" "}
                fired when conditions matched. Use the checklist and phased
                guidance below — same SOP for every alert in this demo.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Response progress
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    allDone ? "text-emerald-400" : "text-foreground",
                  )}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    allDone
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-primary to-cyan-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {allDone ? (
                <p className="text-xs text-emerald-400/90 flex items-center gap-2 animate-in fade-in">
                  <Shield className="h-3.5 w-3.5" />
                  All actions complete — ready for shift handover log.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ~{ACTION_ITEMS.reduce((s, a) => s + a.minutes, 0)} min
                  estimated if followed in order.
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => void copyBrief()}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied to clipboard" : "Copy brief for DOR / shift log"}
            </Button>
          </div>

          {/* Actions + guidance */}
          <div className="lg:col-span-3 p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                Action items
              </p>
              <ul className="space-y-2">
                {ACTION_ITEMS.map((item, index) => {
                  const done = checked.has(item.id);
                  const lane = LANE_META[item.lane];
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-4 transition-all duration-200",
                          "hover:border-primary/40 hover:bg-primary/5",
                          done
                            ? "border-emerald-500/35 bg-emerald-500/5 opacity-80"
                            : "border-border/80 bg-background/40",
                        )}
                      >
                        <div className="flex gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                              done
                                ? "border-emerald-500 bg-emerald-500 text-background"
                                : "border-muted-foreground/40 text-muted-foreground",
                            )}
                          >
                            {done ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium",
                                  done && "line-through text-muted-foreground",
                                )}
                              >
                                {item.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5", lane.color)}
                              >
                                {lane.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                ~{item.minutes} min
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">
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
                Operator guidance
              </p>
              <div className="flex flex-wrap gap-2">
                {GUIDANCE_PHASES.map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setActivePhase(phase.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-all text-sm",
                      activePhase === phase.id
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border/60 text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <span className="font-mono text-[10px] block text-primary">
                      {phase.label}
                    </span>
                    <span className="font-medium">{phase.headline}</span>
                  </button>
                ))}
              </div>
              <div
                className={cn(
                  "rounded-xl border p-4 space-y-3 animate-in fade-in duration-300",
                  LANE_META[
                    activePhase === "immediate"
                      ? "now"
                      : activePhase === "stabilize"
                        ? "next"
                        : "verify"
                  ].bg,
                )}
              >
                {activeGuidance.steps.map((step, i) => (
                  <div key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/80 text-xs font-bold text-primary border border-border/60">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.body}
                      </p>
                    </div>
                    {i < activeGuidance.steps.length - 1 && (
                      <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 self-center ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
