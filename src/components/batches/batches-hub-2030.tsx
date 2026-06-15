"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Beaker,
  Bell,
  GitCompare,
  Layers,
  ChartGantt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BATCH_FIELD_GROUPS,
  MOCK_BATCHES,
  getLabReading,
  type BatchPhaseId,
  type BatchRecord,
} from "@/lib/batch-fixture-data";
import { nearestCheckpointHour } from "@/lib/ferm-field-dictionary";
import {
  BatchIdentityPanel,
  DcsLivePanel,
  LabCheckpointMatrix,
  PlaybookWatchPanel,
  PropAdditionsPanel,
  QualityTrajectoryPanel,
  YeastHealthPanel,
} from "@/components/batches/batch-intelligence-panels";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

function formatElapsed(hours: number): string {
  if (hours < 24) return `${hours}h elapsed`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return `${d}d ${h}h elapsed`;
}


type BatchListTab = "active" | "completed";

const BATCH_TABS: { id: BatchListTab; label: string }[] = [
  { id: "active", label: "Active batches" },
  { id: "completed", label: "Completed" },
];

function isActiveBatch(batch: BatchRecord): boolean {
  return batch.status === "active";
}

function isCompletedBatch(batch: BatchRecord): boolean {
  return batch.status === "completed" || batch.status === "deviation";
}

function PhaseTimeline({ batch }: { batch: BatchRecord }) {
  const total = batch.phases.reduce((s, p) => s + p.durationH, 0);

  return (
    <div className="space-y-3">
      <div className="flex h-10 rounded-lg overflow-hidden border border-border/60 bg-muted/20">
        {batch.phases.map((p) => {
          const w = (p.durationH / total) * 100;
          return (
            <div
              key={p.id}
              style={{ width: `${w}%` }}
              className={cn(
                "h-full flex items-center justify-center text-[9px] font-bold uppercase tracking-wide border-r border-background/20 last:border-0",
                p.status === "done" && "bg-success-muted text-success-foreground",
                p.status === "active" && "bg-primary text-primary-foreground",
                p.status === "pending" && "bg-muted/40 text-muted-foreground",
              )}
              title={p.label}
            >
              {w > 8 ? p.short : ""}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {batch.phases.map((p) => (
          <span
            key={p.id}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border",
              p.status === "done" && "border-success/40 text-success",
              p.status === "active" && "border-primary/50 text-primary",
              p.status === "pending" && "border-border text-muted-foreground",
            )}
          >
            {p.label} · {p.durationH}h
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniCompareChart({
  a,
  b,
  metric,
  decimals = 1,
  suffix = "",
}: {
  a: number;
  b: number;
  metric: string;
  decimals?: number;
  suffix?: string;
}) {
  const max = Math.max(a, b, 0.001);
  const fmt = (n: number) => `${n.toFixed(decimals)}${suffix}`;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{metric}</p>
      <div className="flex items-end gap-3 h-20">
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-primary/60"
            style={{ height: `${(a / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[10px] font-mono text-primary">{fmt(a)}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-amber-400/50"
            style={{ height: `${(b / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[10px] font-mono text-amber-300">{fmt(b)}</span>
        </div>
      </div>
    </div>
  );
}

function ProcessSchematic() {
  return (
    <svg viewBox="0 0 520 200" className="w-full h-auto text-primary/80">
      <defs>
        <linearGradient id="batchPipe" x1="0%" x2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="20" y="60" width="50" height="90" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <text x="45" y="50" textAnchor="middle" className="fill-[9px] font-mono fill-muted-foreground">
        Corn grind
      </text>
      <ellipse cx="160" cy="105" rx="45" ry="55" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="160" y="45" textAnchor="middle" className="fill-[10px] font-bold fill-primary">
        Fermenter
      </text>
      <rect x="280" y="75" width="40" height="60" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <text x="300" y="65" textAnchor="middle" className="fill-[9px] fill-muted-foreground">
        Cooler
      </text>
      <rect x="400" y="70" width="55" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <text x="427" y="58" textAnchor="middle" className="fill-[9px] font-mono fill-muted-foreground">
        Beer well
      </text>
      <path d="M70 105 H115 M205 105 H280 M320 105 H400" stroke="url(#batchPipe)" strokeWidth="3" strokeDasharray="6 3" />
      <circle cx="115" cy="105" r="8" className="fill-success/30 stroke-success" strokeWidth="1" />
      <circle cx="280" cy="105" r="8" className="fill-primary/30 stroke-primary" strokeWidth="1" />
      <text x="260" y="175" textAnchor="middle" className="fill-[8px] fill-muted-foreground">
        Beer commingles downstream · distillation · denatured tank · rack
      </text>
    </svg>
  );
}

export function BatchesHub2030() {
  const searchParams = useSearchParams();
  const agendaItems = useAlertHistoryStore((s) => s.items);
  const batchFromUrl = searchParams.get("batch");
  const [selectedId, setSelectedId] = useState(
    batchFromUrl && MOCK_BATCHES.some((b) => b.id === batchFromUrl)
      ? batchFromUrl
      : "6418",
  );
  const [compareId, setCompareId] = useState("6402");
  const [phaseFilter, setPhaseFilter] = useState<BatchPhaseId | "all">("all");
  const [listTab, setListTab] = useState<BatchListTab>("active");
  const [relatedAlertsExpanded, setRelatedAlertsExpanded] = useState(false);

  useEffect(() => {
    if (batchFromUrl && MOCK_BATCHES.some((b) => b.id === batchFromUrl)) {
      setSelectedId(batchFromUrl);
      const batch = MOCK_BATCHES.find((b) => b.id === batchFromUrl);
      if (batch) {
        setListTab(isActiveBatch(batch) ? "active" : "completed");
      }
    }
  }, [batchFromUrl]);

  useEffect(() => {
    setRelatedAlertsExpanded(false);
  }, [selectedId]);

  const activeBatches = useMemo(
    () => MOCK_BATCHES.filter(isActiveBatch),
    [],
  );
  const completedBatches = useMemo(
    () => MOCK_BATCHES.filter(isCompletedBatch),
    [],
  );
  const visibleBatches = listTab === "active" ? activeBatches : completedBatches;

  useEffect(() => {
    if (visibleBatches.length === 0) return;
    if (!visibleBatches.some((b) => b.id === selectedId)) {
      setSelectedId(visibleBatches[0].id);
    }
  }, [visibleBatches, selectedId]);

  const selected = useMemo(
    () =>
      visibleBatches.find((b) => b.id === selectedId) ??
      visibleBatches[0] ??
      MOCK_BATCHES[0],
    [selectedId, visibleBatches],
  );
  const compare = useMemo(
    () => MOCK_BATCHES.find((b) => b.id === compareId) ?? MOCK_BATCHES[1],
    [compareId],
  );

  const relatedAlerts = useMemo(
    () =>
      agendaItems.filter(
        (a) => a.batchContext?.batchId === selected.id,
      ),
    [agendaItems, selected.id],
  );

  const visibleRelatedAlerts = relatedAlertsExpanded
    ? relatedAlerts
    : relatedAlerts.slice(0, 3);

  const filteredEvents = useMemo(() => {
    if (phaseFilter === "all") return selected.events;
    return selected.events.filter((e) => e.type === "phase" || e.type === "sample" || e.type === "alert");
  }, [selected.events, phaseFilter]);

  const latestCheckpoint = nearestCheckpointHour(selected.fermenterAgeH);
  const latestLab = getLabReading(selected, latestCheckpoint);
  const compareLab = getLabReading(
    compare,
    nearestCheckpointHour(compare.fermenterAgeH),
  );
  const flaggedWatch = selected.playbookWatch.filter((w) => w.status === "flagged").length;

  return (
    <div className="relative min-h-[calc(100vh-0px)] flex flex-col bg-background overflow-hidden">
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-muted p-2 ring-1 ring-border">
            <Layers className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Operational
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              Fermenter batches — lab, DCS & yield
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ferm Data field dictionary · checkpoints 6h–55h · playbooks linked
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {activeBatches.length} active · {BATCH_FIELD_GROUPS.length} field groups
        </Badge>
      </header>

      <div className="relative z-10 px-6 pb-3 border-b border-border bg-card">
        <div className="flex flex-wrap gap-2">
          {BATCH_TABS.map((tab) => {
            const count =
              tab.id === "active" ? activeBatches.length : completedBatches.length;
            const active = listTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-[10px] font-mono rounded px-1.5 py-0.5 tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Batch picker */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select batch
            </p>
            {visibleBatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                No {listTab === "active" ? "active" : "completed"} batches.
              </div>
            ) : (
              visibleBatches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  selectedId === b.id
                    ? "border-primary bg-muted/40 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30 shadow-sm",
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-sm">{b.id}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      b.status === "active" && "border-primary/50 text-foreground",
                      b.status === "completed" && "border-success/40 text-success",
                      b.status === "deviation" && "border-critical/40 text-critical",
                    )}
                  >
                    {b.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{b.ferm} · {b.yeastStrain}</p>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                  {b.fermenterAgeH}h · {b.bushelsCharged.toLocaleString()} bu
                </p>
                <p className="text-xs text-success/90 mt-1 tabular-nums">
                  {b.projectedGalPerBu.toFixed(2)} gal/bu proj.
                </p>
                {b.playbookWatch.some((w) => w.status === "flagged") && (
                  <Badge variant="danger" className="mt-1.5 text-[9px]">
                    Playbook flagged
                  </Badge>
                )}
              </button>
              ))
            )}
          </div>

          {/* Main detail */}
          <div className="lg:col-span-6 space-y-4">
            <BatchIdentityPanel batch={selected} />
            <YeastHealthPanel batch={selected} />
            <DcsLivePanel batch={selected} />
            <LabCheckpointMatrix batch={selected} />
            <QualityTrajectoryPanel batch={selected} />

            <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold font-mono">{selected.id}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.ferm} · started {selected.started} ·{" "}
                    {formatElapsed(selected.fermenterAgeH)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.kpis.map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <p className="text-[9px] uppercase text-muted-foreground">
                        {k.label}
                      </p>
                      <p className="text-sm font-bold tabular-nums">{k.value}</p>
                      <p className="text-[9px] font-mono text-primary/70">{k.field}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Bushels charged</p>
                  <p className="font-bold tabular-nums">
                    {selected.bushelsCharged.toLocaleString()} bu
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Std / projected</p>
                  <p className="font-bold tabular-nums">
                    {selected.targetGalPerBu.toFixed(2)} → {selected.projectedGalPerBu.toFixed(2)} gal/bu
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Ethanol equiv.</p>
                  <p className="font-bold tabular-nums">
                    {Math.round(
                      selected.bushelsCharged * selected.projectedGalPerBu,
                    ).toLocaleString()}{" "}
                    gal
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    target{" "}
                    {Math.round(
                      selected.bushelsCharged * selected.targetGalPerBu,
                    ).toLocaleString()}{" "}
                    gal
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Beer well drop</p>
                  <p className="font-bold tabular-nums">
                    {selected.beerGalAtDrop
                      ? `${selected.beerGalAtDrop.toLocaleString()} gal`
                      : "Pending close"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <ChartGantt className="h-3.5 w-3.5" />
                  Phases & duration
                </p>
                <PhaseTimeline batch={selected} />
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setPhaseFilter("all")}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border",
                      phaseFilter === "all"
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    All events
                  </button>
                  {selected.phases.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPhaseFilter(p.id)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        phaseFilter === p.id
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {p.short}
                    </button>
                  ))}
                </div>
              </div>

              {relatedAlerts.length > 0 && (
                <div className="rounded-xl border border-critical/25 bg-critical-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-critical-foreground mb-2 flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5" />
                    Related alerts ({relatedAlerts.length})
                  </p>
                  <ul className="space-y-1 text-sm">
                    {visibleRelatedAlerts.map((a) => (
                      <li key={a.id} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{a.alertTitle ?? a.playbookName}</span>
                        {" · "}
                        {a.lifecycle ?? "new"}
                        {a.severity === "critical" && " · critical"}
                      </li>
                    ))}
                  </ul>
                  {relatedAlerts.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setRelatedAlertsExpanded((v) => !v)}
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      {relatedAlertsExpanded
                        ? "See less"
                        : `See more (${relatedAlerts.length - 3} more)`}
                    </button>
                  )}
                </div>
              )}

              <PropAdditionsPanel batch={selected} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Process schematic
                </p>
                <ProcessSchematic />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Beaker className="h-3.5 w-3.5" />
                What happened — event timeline
              </p>
              <ul className="space-y-2">
                {filteredEvents.map((e, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm border-l-2 border-success/30 pl-3 py-1"
                  >
                    <span className="font-mono text-xs text-muted-foreground shrink-0 w-12">
                      {e.ts}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] uppercase px-1.5 rounded shrink-0 h-fit",
                        e.type === "alert" && "bg-critical-muted text-critical-foreground",
                        e.type === "sample" && "bg-violet-100 text-violet-700",
                        e.type === "phase" && "bg-success-muted text-success-foreground",
                        e.type === "signal" && "bg-muted text-foreground",
                      )}
                    >
                      {e.type}
                    </span>
                    <span className="text-muted-foreground">
                      {e.summary}
                      {e.field && (
                        <span className="font-mono text-primary/80 text-xs ml-1">
                          · {e.field}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Compare */}
          <div className="lg:col-span-3 space-y-3">
            <PlaybookWatchPanel batch={selected} />

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <GitCompare className="h-3.5 w-3.5" />
              Compare batches
            </p>
            <div className="rounded-xl border border-amber-500/25 bg-gradient-to-b from-amber-500/8 to-card/20 p-4 space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground">Baseline</label>
                <p className="font-mono font-bold text-primary">{selected.id}</p>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Compare to
                </label>
                <select
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/80 px-2 py-1.5 text-sm font-mono"
                >
                  {MOCK_BATCHES.filter((b) => b.id !== selected.id).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}
                    </option>
                  ))}
                </select>
              </div>
              <MiniCompareChart
                a={latestLab?.potential ?? selected.projectedGalPerBu}
                b={compareLab?.potential ?? compare.projectedGalPerBu}
                metric={`Potential @ ${latestCheckpoint}h`}
                decimals={1}
                suffix="%"
              />
              <MiniCompareChart
                a={latestLab?.temp ?? 0}
                b={compareLab?.temp ?? 0}
                metric={`Temp @ checkpoint`}
                decimals={1}
                suffix=" °F"
              />
              <p className="text-[10px] text-muted-foreground leading-snug">
                Yield delta:{" "}
                <strong className="text-foreground">
                  {(selected.projectedGalPerBu - compare.projectedGalPerBu).toFixed(2)} gal/bu
                </strong>{" "}
                vs {compare.id}
              </p>
              {flaggedWatch > 0 && (
                <Badge variant="danger" className="text-[9px] w-full justify-center">
                  {flaggedWatch} playbook flag{flaggedWatch > 1 ? "s" : ""} on {selected.id}
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] w-full justify-center">
                Ferm Data dictionary · checkpoint compare
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
