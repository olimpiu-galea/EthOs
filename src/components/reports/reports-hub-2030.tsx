"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReportCard = {
  id: string;
  name: string;
  abbr: string;
  cadence: string;
  audience: string;
  wasManual: string;
  future: string;
  accent: "cyan" | "amber" | "violet" | "emerald";
};

const REPORTS: ReportCard[] = [
  {
    id: "dor",
    name: "Daily Operations Report",
    abbr: "DOR",
    cadence: "Every 24h · end of day",
    audience: "Operations manager, shift leads",
    wasManual: "Compiled by hand from shift logs, lab slips, and DCS printouts",
    future: "Auto-filled from signals, batches, and agenda events",
    accent: "cyan",
  },
  {
    id: "shift",
    name: "Shift handover summary",
    abbr: "SHO",
    cadence: "Per shift change (×3 daily)",
    audience: "Incoming / outgoing operators",
    wasManual: "Whiteboard + Word template, typed after walkthrough",
    future: "Generated snapshot: alarms, batches, open actions",
    accent: "amber",
  },
  {
    id: "batch",
    name: "Batch / fermentation record",
    abbr: "BFR",
    cadence: "Per batch · drop to drop",
    audience: "Production & quality",
    wasManual: "Excel batch folder, PV peaks copied manually",
    future: "Linked to batch ID, trends, and playbook triggers",
    accent: "emerald",
  },
  {
    id: "quality",
    name: "Quality & lab summary",
    abbr: "QLS",
    cadence: "Daily + per sample campaign",
    audience: "QA, lab coordinator",
    wasManual: "LIMS export + manual comments in shared drive",
    future: "pH, DO, EtOH @ drop pulled from historian",
    accent: "violet",
  },
  {
    id: "downtime",
    name: "Downtime & deviation log",
    abbr: "DDL",
    cadence: "As incidents occur",
    audience: "Maintenance, reliability",
    wasManual: "Paper log at panel, typed into CMMS later",
    future: "Tied to equipment faceplates and alarm history",
    accent: "amber",
  },
  {
    id: "weekly",
    name: "Weekly production KPI pack",
    abbr: "WPP",
    cadence: "Monday morning",
    audience: "Plant leadership",
    wasManual: "PowerPoint built from multiple spreadsheets",
    future: "One-click rollup: throughput, yield, energy, alerts",
    accent: "cyan",
  },
];

const accentMap = {
  cyan: {
    border: "border-primary/30",
    bg: "from-primary/15 via-card/40 to-card/20",
    badge: "bg-primary/15 text-primary border-primary/30",
    icon: "text-primary",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "from-amber-500/12 via-card/40 to-card/20",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: "text-amber-400",
  },
  violet: {
    border: "border-violet-500/30",
    bg: "from-violet-500/12 via-card/40 to-card/20",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    icon: "text-violet-400",
  },
  emerald: {
    border: "border-emerald-500/30",
    bg: "from-emerald-500/12 via-card/40 to-card/20",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: "text-emerald-400",
  },
};

export function ReportsHub2030() {
  return (
    <div className="relative min-h-[calc(100vh-0px)] flex flex-col bg-[#060a12] overflow-hidden">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(270 60% 50% / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(270 60% 50% / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/8 via-transparent to-primary/5 pointer-events-none" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-violet-500/20 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-violet-500/15 p-2 ring-1 ring-violet-400/30">
            <FileSpreadsheet className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 font-medium">
              Reporting suite · 2030
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              Operations reports — from manual to automated
            </h1>
          </div>
        </div>
        <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/40">
          Coming soon
        </Badge>
      </header>

      <div className="relative flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-md p-5 flex flex-col sm:flex-row gap-4 items-start">
            <div className="rounded-xl bg-amber-500/15 p-3 shrink-0">
              <PenLine className="h-8 w-8 text-amber-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-200/90">
                Until now: written by hand
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Teams still build critical packs manually — copy-paste from DCS,
                shift notes, and spreadsheets. <strong className="text-foreground">DORs</strong>, shift
                handovers, and batch records take hours and drift out of sync
                with live plant data.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-xs border-amber-500/30">
                  Excel · Word · paper log
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500/30">
                  Error-prone handoff
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REPORTS.map((r) => {
              const a = accentMap[r.accent];
              return (
                <div
                  key={r.id}
                  className={cn(
                    "relative rounded-xl border p-5 bg-gradient-to-br backdrop-blur-sm overflow-hidden group",
                    a.border,
                    a.bg,
                  )}
                >
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold", a.badge)}
                    >
                      {r.abbr}
                    </Badge>
                  </div>
                  <FileText
                    className={cn("h-6 w-6 mb-3 opacity-80", a.icon)}
                  />
                  <h3 className="font-semibold pr-12 leading-snug">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.cadence}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    {r.audience}
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-amber-400/90 mb-1">
                        Today (manual)
                      </p>
                      <p className="text-muted-foreground leading-snug">
                        {r.wasManual}
                      </p>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-primary/80 mb-1">
                        Tomorrow (automated)
                      </p>
                      <p className="text-muted-foreground leading-snug">
                        {r.future}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[10px] text-violet-300/70 flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Scheduled export · PDF / share
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-card/60 backdrop-blur-xl p-6 text-center space-y-3 max-w-2xl mx-auto">
            <Sparkles className="h-7 w-7 text-violet-400 mx-auto" />
            <p className="text-lg font-semibold">Report generation — coming soon</p>
            <p className="text-sm text-muted-foreground">
              One-click DOR and shift packs built from signals, playbooks, and
              agenda — no retyping from the panel.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/agenda">
                See today&apos;s events in Agenda
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-violet-500/15 bg-card/30 px-4 py-2 text-[10px] text-muted-foreground font-mono flex flex-wrap gap-4">
        <span>Next: DOR wizard · template library · e-sign handover</span>
        <span className="ml-auto opacity-60">Archive: shared drive / 2024–2025 manual</span>
      </footer>
    </div>
  );
}
