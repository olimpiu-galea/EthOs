"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Beaker,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  FileBarChart,
  Layers,
  Lock,
  Radio,
  Shield,
  Sparkles,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { PRODUCT_NAME } from "@/lib/brand";

type ContextSource = {
  id: string;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "live" | "synced" | "indexed";
  metric: string;
};

type Citation = {
  label: string;
  tone?: "playbook" | "batch" | "report" | "signal";
};

type ChatTurn = {
  role: "user" | "assistant";
  content: React.ReactNode;
  citations?: Citation[];
  thinking?: string;
};

const CITATION_STYLES: Record<
  NonNullable<Citation["tone"]>,
  string
> = {
  playbook: "border-primary/25 bg-primary/5 text-foreground",
  batch: "border-success/30 bg-success-muted text-success-foreground",
  report: "border-border bg-muted/40 text-muted-foreground",
  signal: "border-critical/25 bg-critical-muted text-critical-foreground",
};

const SUGGESTED_PROMPTS = [
  "What should I prioritize before night shift?",
  "Explain the acetic flag on batch 6402",
  "Summarize today's shift handover in 3 bullets",
  "Which fermenters are near temp cap at 18h?",
  "Draft a QA note for the potential drift on 6418",
];

function CitationPill({ label, tone = "playbook" }: Citation) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        CITATION_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}

function ContextRow({ source }: { source: ContextSource }) {
  const Icon = source.icon;
  return (
    <div className="group rounded-xl border border-border/70 bg-card/80 p-3 transition-colors hover:border-primary/25 hover:bg-card">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/80">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate">{source.label}</p>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                source.status === "live" && "bg-success animate-pulse",
                source.status === "synced" && "bg-success",
                source.status === "indexed" && "bg-muted-foreground/50",
              )}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {source.detail}
          </p>
          <p className="text-[10px] font-medium text-primary/80 mt-1.5 tabular-nums">
            {source.metric}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function MessageBubble({
  turn,
  userName,
}: {
  turn: ChatTurn;
  userName: string;
}) {
  const isUser = turn.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isUser
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-gradient-to-br from-primary/10 to-success/10 border-border",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[92%] space-y-2",
          isUser ? "items-end text-right" : "items-start",
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {isUser ? userName : "Plant Copilot"}
        </p>
        {!isUser && turn.thinking && (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Reasoning
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              {turn.thinking}
            </p>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed text-left shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-card border border-border/80 rounded-tl-md",
          )}
        >
          {turn.content}
        </div>
        {turn.citations && turn.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {turn.citations.map((c) => (
              <CitationPill key={c.label} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlantCopilotDemo() {
  const user = useAuthStore((s) => s.user);
  const companyName = useSettingsStore((s) => s.companyName);
  const userName = user?.name ?? "Operator";
  const roleLabel = user ? ROLE_LABELS[user.role] : "Operational";

  const contextSources: ContextSource[] = useMemo(
    () => [
      {
        id: "dcs",
        label: "DCS live tags",
        detail: "Ferm A/B temps, agitator, cooling valves — 15 min cadence",
        icon: Radio,
        status: "live",
        metric: "312 tags · synced 2 min ago",
      },
      {
        id: "lab",
        label: "Lab sheet",
        detail: "Potential, acetic, sugars, cell count by batch & checkpoint",
        icon: Beaker,
        status: "synced",
        metric: "48 rows today · last upload 07:42",
      },
      {
        id: "batches",
        label: "Operational workspace",
        detail: "Active batches, phase, age, fermenter assignment",
        icon: Layers,
        status: "live",
        metric: "6 active · 2 flagged",
      },
      {
        id: "playbooks",
        label: "Playbooks & alerts",
        detail: "Rules, action items, guidance, lifecycle & escalation",
        icon: BookOpen,
        status: "indexed",
        metric: "11 playbooks · 3 open alerts",
      },
      {
        id: "sho",
        label: "Shift handover",
        detail: "Day/night SHO reports, outgoing notes, open actions",
        icon: FileBarChart,
        status: "synced",
        metric: "SHO — Day · today 06:00",
      },
      {
        id: "margin",
        label: "Margin & procurement",
        detail: "Financial exposure, tank levels, procurement signals",
        icon: Wallet,
        status: "indexed",
        metric: "Phrase 2 feeds · optional context",
      },
    ],
    [],
  );

  const conversation: ChatTurn[] = useMemo(
    () => [
      {
        role: "user",
        content: (
          <>
            Batch <strong>6418</strong> on Ferm B just hit the daily demo alert.
            What&apos;s the fastest way to close it without missing anything?
          </>
        ),
      },
      {
        role: "assistant",
        thinking:
          "Cross-referencing batch 6418 workspace, 08:00 lab row, DCS FermB_Temp/agitator, and Daily Demo playbook action items…",
        content: (
          <div className="space-y-3">
            <p>
              Batch <strong>6418</strong> is in <strong>active ferment</strong> on{" "}
              <strong>Ferm B</strong>, age <strong>18h</strong>. Lab at 08:00 shows{" "}
              <strong>potential 14.2%</strong> and <strong>temp 33.8°C</strong> — within
              band but trending warm vs yesterday&apos;s SHO note.
            </p>
            <p className="font-medium">Recommended close-out sequence:</p>
            <ol className="list-decimal pl-5 space-y-1 text-[13px]">
              <li>Confirm live DCS vs lab before any setpoint move.</li>
              <li>Walk the four playbook action items in order (review → compare → correct → log).</li>
              <li>Mark lifecycle <em>In progress</em>, then <em>Resolve</em> once cooling stable 30 min.</li>
            </ol>
            <p className="text-muted-foreground text-[13px]">
              Night shift inherits this if unresolved — SHO Day already flags cooling drift on Ferm B.
            </p>
          </div>
        ),
        citations: [
          { label: "Daily Demo Playbook", tone: "playbook" },
          { label: "Batch 6418 · Ferm B", tone: "batch" },
          { label: "Lab row 08:00", tone: "signal" },
          { label: "SHO — Day", tone: "report" },
        ],
      },
      {
        role: "user",
        content: (
          <>
            Compare that to what night shift left in the last handover — did we already
            adjust cooling on B?
          </>
        ),
      },
      {
        role: "assistant",
        thinking:
          "Reading SHO — Day (06:00) outgoing notes and audit trail for Ferm B cooling…",
        content: (
          <div className="space-y-3">
            <p>
              <strong>SHO — Day</strong> (06:00) documents a{" "}
              <strong>+2°C drift on Ferm B</strong> overnight. Outgoing operator increased
              cooling setpoint at <strong>04:15</strong> and noted agitator amps stable.
            </p>
            <p>
              Your 08:00 lab still shows temp elevated vs target — so the alert is{" "}
              <strong>consistent with incomplete correction</strong>, not a new failure mode.
              Re-verify valve response before a second adjustment; duplicate moves without
              confirmation are called out in the handover open actions.
            </p>
          </div>
        ),
        citations: [
          { label: "SHO — Day · 04:15 note", tone: "report" },
          { label: "FermB_Cooling_SP", tone: "signal" },
          { label: "Open action · verify valve", tone: "playbook" },
        ],
      },
      {
        role: "user",
        content: (
          <>
            If potential on a YP batch drops below 12% at the 18h checkpoint, who gets
            notified and what&apos;s the temp cap?
          </>
        ),
      },
      {
        role: "assistant",
        thinking:
          "Matching YP strain row in Potential vs Temperature playbook classification table…",
        content: (
          <div className="space-y-3">
            <p>
              For <strong>YP</strong> at the <strong>18h</strong> checkpoint, the playbook
              pairs <strong>potential &lt; 12%</strong> with a fermenter temp cap of{" "}
              <strong>34.0°C</strong>. This fires a warning-level alert assigned to{" "}
              <strong>Operational</strong>; critical combinations escalate to{" "}
              <strong>Supervisor + QA</strong> per SOP.
            </p>
            <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[13px]">
              This is exactly the kind of cross-table question operators ask mid-shift —
              Copilot reads the same rules {PRODUCT_NAME} uses for live alerts, so answers stay
              aligned with what the floor sees.
            </p>
          </div>
        ),
        citations: [
          { label: "Potential vs Temp · YP · 18h", tone: "playbook" },
          { label: "Escalation L1 → L2", tone: "playbook" },
          { label: "Role: Operational", tone: "report" },
        ],
      },
    ],
    [],
  );

  return (
    <div className="min-h-full bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(var(--success) / 0.12), transparent 45%), radial-gradient(circle at 80% 20%, hsl(var(--critical) / 0.08), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <Bot className="h-3.5 w-3.5" />
                Plant Copilot
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Lock className="h-3 w-3" />
                Preview — not connected to a model yet
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ask anything.{" "}
              <span className="text-muted-foreground">Full {companyName} context.</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Plant Copilot sits on the same live signals, playbooks, batches, shift
              handovers, and reports your team already uses in {PRODUCT_NAME} — so answers cite
              real plant state instead of generic chatbot guesses.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-critical" />
                  What Copilot knows
                </p>
                <Badge variant="success" className="text-[10px]">
                  All feeds
                </Badge>
              </div>
              <div className="space-y-2">
                {contextSources.map((source) => (
                  <ContextRow key={source.id} source={source} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Unlike a generic chatbot
              </p>
              <ul className="space-y-2 text-[12px] text-muted-foreground leading-relaxed">
                <li className="flex gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Knows today&apos;s agenda, alerts, and shift window
                </li>
                <li className="flex gap-2">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Quotes the same playbook rows that fire real alerts
                </li>
                <li className="flex gap-2">
                  <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  Role-aware — procurement sees margin; QA sees lab clusters
                </li>
              </ul>
            </div>
          </aside>

          <section className="flex flex-col min-h-[620px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 bg-muted/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Shift conversation · demo</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {userName} · {roleLabel} · {companyName}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Example transcript
              </Badge>
            </div>

            <div
              className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {conversation.map((turn, i) => (
                <MessageBubble key={i} turn={turn} userName={userName} />
              ))}
            </div>

            <div className="border-t border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled
                    className="rounded-full border border-border/80 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground cursor-not-allowed hover:bg-muted/40 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    disabled
                    placeholder="Ask about a batch, playbook, handover, or margin move…"
                    className="w-full rounded-xl border border-input bg-muted/20 px-4 py-3 pr-24 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Preview
                  </span>
                </div>
                <Button disabled className="shrink-0 gap-2 rounded-xl px-5">
                  Send
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                Production Copilot will stream answers here with clickable citations into
                Agenda, Operational, and Reports — this page is a visual prototype only.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
