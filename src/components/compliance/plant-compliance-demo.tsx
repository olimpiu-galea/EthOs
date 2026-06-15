"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileBarChart,
  Layers,
  Lock,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import {
  LAKEVIEW_COMPLIANCE_ZONES,
  LAKEVIEW_DOC_CADENCE,
  LAKEVIEW_OPEN_DEVIATIONS,
  type ComplianceStatus,
} from "@/lib/lakeview-plant-compliance-fixture";
import {
  complianceWatchItems,
  type ComplianceWatchStatus,
} from "@/lib/compliance-playbooks";

const STATUS_STYLES: Record<
  ComplianceStatus,
  { badge: string; dot: string; label: string }
> = {
  good: {
    badge: "border-success/30 bg-success-muted text-success-foreground",
    dot: "bg-success",
    label: "On track",
  },
  watch: {
    badge: "border-critical/30 bg-critical-muted text-critical-foreground",
    dot: "bg-critical",
    label: "Watch",
  },
  critical: {
    badge: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    label: "Action required",
  },
};

const DEV_STATUS: Record<string, string> = {
  open: "border-critical/30 text-critical-foreground",
  investigating: "border-primary/30 text-foreground",
  closed: "border-success/30 text-success",
};

/** Mirrors the Batches "Playbook watch" status styling */
const WATCH_STATUS_STYLES: Record<ComplianceWatchStatus, string> = {
  clear: "border-success/30 text-success",
  watch: "border-critical/30 bg-critical-muted text-critical-foreground",
  flagged: "border-critical/40 text-critical",
};

const SEVERITY_RANK: Record<ComplianceStatus, number> = {
  critical: 2,
  watch: 1,
  good: 0,
};

type FilterId = "zones" | "deviations" | "docs";

function ZoneCard({
  zone,
  selected,
  onSelect,
}: {
  zone: (typeof LAKEVIEW_COMPLIANCE_ZONES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const s = STATUS_STYLES[zone.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-xl border bg-card p-4 space-y-2 text-left shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{zone.label}</p>
        <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", s.dot)} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{zone.summary}</p>
      <p className="text-[10px] font-mono text-primary/80">{zone.metric}</p>
      <Badge variant="outline" className={cn("text-[9px]", s.badge)}>
        {s.label}
      </Badge>
    </button>
  );
}

function KpiFilterCard({
  label,
  value,
  active,
  alert,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  alert: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border bg-card p-4 text-left shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          alert && value > 0 ? "text-critical" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">
        {active ? "Filtering · click to clear" : "Click to filter"}
      </p>
    </button>
  );
}

function PlaybookWatchPanel() {
  const watch = complianceWatchItems();

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        Playbook watch
      </p>
      <ul className="space-y-2">
        {watch.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
          >
            <span
              className={cn(
                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                item.status === "clear" && "bg-success",
                item.status === "watch" && "bg-critical",
                item.status === "flagged" && "bg-destructive",
              )}
            />
            <div className="min-w-0">
              <Link
                href="/playbooks"
                className="text-sm font-medium hover:underline"
              >
                {item.title}
              </Link>
              <p className="text-xs text-muted-foreground">{item.rule}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[9px] capitalize",
                WATCH_STATUS_STYLES[item.status],
              )}
            >
              {item.status}
            </Badge>
          </li>
        ))}
      </ul>
      <Link
        href="/agenda"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <Activity className="h-3 w-3" />
        Open Agenda for active alerts
      </Link>
    </div>
  );
}

export function PlantComplianceDemo() {
  const router = useRouter();
  const companyName = useSettingsStore((s) => s.companyName);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);

  const [activeFilter, setActiveFilter] = useState<FilterId | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  useEffect(() => {
    if (domain !== "ethanol" || !phase2Enabled) {
      router.replace("/playbooks");
    }
  }, [domain, phase2Enabled, router]);

  if (domain !== "ethanol" || !phase2Enabled) return null;

  const watchCount = LAKEVIEW_COMPLIANCE_ZONES.filter(
    (z) => z.status !== "good",
  ).length;
  const openDeviationCount = LAKEVIEW_OPEN_DEVIATIONS.filter(
    (d) => d.status !== "closed",
  ).length;
  const missingDocCount = LAKEVIEW_DOC_CADENCE.filter(
    (d) => d.todayStatus === "missing",
  ).length;

  function toggleFilter(id: FilterId) {
    setActiveFilter((prev) => (prev === id ? null : id));
  }

  const sortedZones = [...LAKEVIEW_COMPLIANCE_ZONES].sort(
    (a, b) => SEVERITY_RANK[b.status] - SEVERITY_RANK[a.status],
  );
  const visibleZones =
    activeFilter === "zones"
      ? sortedZones.filter((z) => z.status !== "good")
      : sortedZones;
  const visibleDeviations =
    activeFilter === "deviations"
      ? LAKEVIEW_OPEN_DEVIATIONS.filter((d) => d.status !== "closed")
      : LAKEVIEW_OPEN_DEVIATIONS;
  const visibleDocs =
    activeFilter === "docs"
      ? LAKEVIEW_DOC_CADENCE.filter(
          (d) => d.todayStatus === "missing" || d.todayStatus === "draft",
        )
      : LAKEVIEW_DOC_CADENCE;

  return (
    <div className="min-h-full bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, hsl(var(--success) / 0.1), transparent 50%), radial-gradient(circle at 85% 30%, hsl(var(--critical) / 0.08), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Plant compliance
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Lock className="h-3 w-3" />
              Demo · {companyName} ethanol operations
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              Plant standard · 2.85 gal/bu
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl max-w-3xl">
            Lakeview compliance — fermentation, lab, product & shift proof
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
            Not platform audit — this is how the <strong>plant</strong> stays
            defensible: batch records, Ferm Data samples, playbook responses,
            and SHO/DOR/BPR documentation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-10">
        <section className="grid gap-3 sm:grid-cols-3">
          <KpiFilterCard
            label="Zones on watch"
            value={watchCount}
            active={activeFilter === "zones"}
            alert
            onClick={() => toggleFilter("zones")}
          />
          <KpiFilterCard
            label="Open deviations"
            value={openDeviationCount}
            active={activeFilter === "deviations"}
            alert
            onClick={() => toggleFilter("deviations")}
          />
          <KpiFilterCard
            label="Docs missing today"
            value={missingDocCount}
            active={activeFilter === "docs"}
            alert
            onClick={() => toggleFilter("docs")}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Plant posture today</h2>
              </div>
              {activeFilter === "zones" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {visibleZones.map((z) => (
                <ZoneCard
                  key={z.id}
                  zone={z}
                  selected={selectedZoneId === z.id}
                  onSelect={() =>
                    setSelectedZoneId((prev) => (prev === z.id ? null : z.id))
                  }
                />
              ))}
            </div>
          </div>
          <PlaybookWatchPanel />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-critical" />
                Deviation register
              </h2>
              {activeFilter === "deviations" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
            <ul className="space-y-2">
              {visibleDeviations.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm">{d.batchId}</span>
                    <span className="text-xs text-muted-foreground">{d.fermenter}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] capitalize ml-auto", DEV_STATUS[d.status])}
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium">{d.issue}</p>
                  <p className="text-[10px] text-muted-foreground">{d.source}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {d.owner} · due {d.due}
                    </span>
                    <Link
                      href={d.link}
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Batch workspace
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/agenda">
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                Review open alerts on Agenda
              </Button>
            </Link>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                Required documentation
              </h2>
              {activeFilter === "docs" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
            <ul className="space-y-2">
              {visibleDocs.map((doc) => (
                <li
                  key={doc.abbr}
                  className="rounded-lg border border-border/60 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {doc.abbr}
                      <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                        {doc.template}
                      </span>
                    </span>
                    <DocStatusBadge status={doc.todayStatus} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{doc.cadence}</p>
                  <p className="text-xs">{doc.lastTitle}</p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {doc.complianceNote}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                Open Reports · filtered by today
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-muted/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold">Explore linked plant workspaces</p>
            <p className="text-sm text-muted-foreground max-w-xl">
              Compliance demo ties to live mock data — batches 6418/6402/6391,
              Agenda alerts, Reports with day filter, and Ferm Data dictionary.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/operational">
                <Layers className="h-3.5 w-3.5" />
                Operational
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/playbooks">
                <BookOpen className="h-3.5 w-3.5" />
                Playbooks
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/reports">
                <FileBarChart className="h-3.5 w-3.5" />
                Reports
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DocStatusBadge({
  status,
}: {
  status: (typeof LAKEVIEW_DOC_CADENCE)[number]["todayStatus"];
}) {
  const map = {
    complete: { label: "Complete", className: "border-success/30 text-success" },
    draft: { label: "Draft", className: "border-primary/30 text-foreground" },
    missing: { label: "Missing", className: "border-critical/30 text-critical" },
    "n/a": { label: "N/A", className: "border-border text-muted-foreground" },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("text-[9px] shrink-0", m.className)}>
      {m.label}
    </Badge>
  );
}
