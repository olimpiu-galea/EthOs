"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  GitCompare,
  Layers,
  ChartGantt,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BATCH_FIELD_GROUPS,
  MOCK_BATCHES,
  type BatchRecord,
} from "@/lib/batch-fixture-data";

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
                p.status === "done" && "bg-emerald-500/35 text-emerald-100",
                p.status === "active" && "bg-primary/50 text-primary-foreground animate-pulse",
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
              p.status === "done" && "border-emerald-500/40 text-emerald-400",
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
}: {
  a: number;
  b: number;
  metric: string;
}) {
  const max = Math.max(a, b, 1);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{metric}</p>
      <div className="flex items-end gap-3 h-20">
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-primary/60"
            style={{ height: `${(a / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[10px] font-mono text-primary">{a}%</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-amber-400/50"
            style={{ height: `${(b / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[10px] font-mono text-amber-300">{b}%</span>
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
        Feed
      </text>
      <ellipse cx="160" cy="105" rx="45" ry="55" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="160" y="45" textAnchor="middle" className="fill-[10px] font-bold fill-primary">
        Reactor
      </text>
      <rect x="280" y="75" width="40" height="60" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <text x="300" y="65" textAnchor="middle" className="fill-[9px] fill-muted-foreground">
        HX
      </text>
      <rect x="400" y="70" width="55" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <text x="427" y="58" textAnchor="middle" className="fill-[9px] font-mono fill-muted-foreground">
        Product
      </text>
      <path d="M70 105 H115 M205 105 H280 M320 105 H400" stroke="url(#batchPipe)" strokeWidth="3" strokeDasharray="6 3" />
      <circle cx="115" cy="105" r="8" className="fill-emerald-500/30 stroke-emerald-400" strokeWidth="1" />
      <circle cx="280" cy="105" r="8" className="fill-primary/30 stroke-primary" strokeWidth="1" />
      <text x="260" y="175" textAnchor="middle" className="fill-[8px] fill-muted-foreground">
        Tank switchover · valve route · batch phase marker
      </text>
    </svg>
  );
}

export function BatchesHub2030() {
  const [selectedId, setSelectedId] = useState(MOCK_BATCHES[0].id);
  const [compareId, setCompareId] = useState(MOCK_BATCHES[1].id);

  const selected = useMemo(
    () => MOCK_BATCHES.find((b) => b.id === selectedId) ?? MOCK_BATCHES[0],
    [selectedId],
  );
  const compare = useMemo(
    () => MOCK_BATCHES.find((b) => b.id === compareId) ?? MOCK_BATCHES[1],
    [compareId],
  );

  return (
    <div className="relative min-h-[calc(100vh-0px)] flex flex-col bg-[#060a12] overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, hsl(160 60% 40% / 0.12), transparent 45%),
            radial-gradient(circle at 80% 70%, hsl(var(--primary) / 0.08), transparent 40%)`,
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-emerald-500/20 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/15 p-2 ring-1 ring-emerald-400/30">
            <Layers className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 font-medium">
              Batch intelligence · 2030
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              Production batches — lifecycle & compare
            </h1>
          </div>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
          Coming soon
        </Badge>
      </header>

      <div className="relative flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Batch picker */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select batch
            </p>
            {MOCK_BATCHES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  selectedId === b.id
                    ? "border-emerald-400/50 bg-emerald-500/10 ring-1 ring-emerald-400/30"
                    : "border-border/60 bg-card/30 hover:border-emerald-500/30",
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-sm">{b.id}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      b.status === "active" && "border-primary/50 text-primary",
                      b.status === "completed" && "border-emerald-500/40 text-emerald-400",
                      b.status === "deviation" && "border-amber-500/40 text-amber-400",
                    )}
                  >
                    {b.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{b.ferm}</p>
                <p className="text-xs text-emerald-400/90 mt-2 tabular-nums">
                  Yield @ close {b.dropEtOH}%
                </p>
              </button>
            ))}
          </div>

          {/* Main detail */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-emerald-500/25 bg-card/40 backdrop-blur-md p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold font-mono">{selected.id}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.ferm} · started {selected.started}
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <ChartGantt className="h-3.5 w-3.5" />
                  Phases & duration
                </p>
                <PhaseTimeline batch={selected} />
              </div>

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
                {selected.events.map((e, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm border-l-2 border-emerald-500/30 pl-3 py-1"
                  >
                    <span className="font-mono text-xs text-muted-foreground shrink-0 w-12">
                      {e.ts}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] uppercase px-1.5 rounded shrink-0 h-fit",
                        e.type === "alert" && "bg-amber-500/15 text-amber-300",
                        e.type === "sample" && "bg-violet-500/15 text-violet-300",
                        e.type === "phase" && "bg-emerald-500/15 text-emerald-300",
                        e.type === "signal" && "bg-primary/15 text-primary",
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
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
                a={selected.dropEtOH}
                b={compare.dropEtOH}
                metric="Yield @ close"
              />
              <MiniCompareChart
                a={selected.brixDrop}
                b={compare.brixDrop}
                metric="Quality @ close"
              />
              <p className="text-[10px] text-muted-foreground leading-snug">
                Delta yield:{" "}
                <strong className="text-foreground">
                  {(selected.dropEtOH - compare.dropEtOH).toFixed(1)} pts
                </strong>{" "}
                vs {compare.id}
              </p>
              <Badge variant="outline" className="text-[9px] w-full justify-center">
                Multi-batch overlay · coming soon
              </Badge>
            </div>
          </div>
        </div>

        {/* Field dictionary */}
        <div className="rounded-xl border border-dashed border-emerald-500/20 bg-muted/5 p-5">
          <p className="text-sm font-semibold mb-1">
            Batch field dictionary (preview)
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-3xl">
            Future batch view maps lab rows and DCS markers to a single
            timeline — configurable per industry and site.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BATCH_FIELD_GROUPS.map((g) => (
              <div
                key={g.group}
                className="rounded-lg border border-border/50 bg-card/40 p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/90 mb-2">
                  {g.group}
                </p>
                <ul className="space-y-1">
                  {g.fields.map((f) => (
                    <li key={f} className="text-[11px] font-mono text-muted-foreground">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/30 bg-card/70 backdrop-blur-xl p-5 text-center space-y-3 max-w-xl mx-auto">
          <Sparkles className="h-6 w-6 text-emerald-400 mx-auto" />
          <p className="font-semibold">Full batch workspace — coming soon</p>
          <p className="text-sm text-muted-foreground">
            Pick any batch, scrub through phases, open lab rows by hour, and
            compare two or more batches on one chart.
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dcs">
              Process overview (DCS)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
