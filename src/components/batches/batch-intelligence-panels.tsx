"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Beaker,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Radio,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BatchRecord } from "@/lib/batch-fixture-data";
import { getLabReading, postedCheckpoints } from "@/lib/batch-fixture-data";
import {
  FERM_CHECKPOINT_COLUMNS,
  FERM_MATRIX_FIELDS,
  formatMatrixValue,
  nearestCheckpointHour,
  nextCheckpointHour,
  type FermCheckpointKey,
  type FermMatrixFieldKey,
} from "@/lib/ferm-field-dictionary";

const STATUS_STYLES = {
  ok: "border-success/30 bg-success-muted text-success-foreground",
  watch: "border-critical/30 bg-critical-muted text-critical-foreground",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  clear: "border-success/30 text-success",
  flagged: "border-critical/40 text-critical",
} as const;

function matrixCellValue(
  batch: BatchRecord,
  checkpoint: FermCheckpointKey,
  fieldKey: FermMatrixFieldKey,
): string {
  const reading = getLabReading(batch, checkpoint);
  if (!reading?.posted) return "—";
  const field = FERM_MATRIX_FIELDS.find((f) => f.key === fieldKey);
  if (!field) return "—";
  if (
    "earlyOnly" in field &&
    field.earlyOnly &&
    checkpoint !== "yp" &&
    checkpoint !== 6 &&
    checkpoint !== 12
  ) {
    return "—";
  }
  const val = reading[fieldKey as keyof typeof reading];
  if (typeof val !== "number") return "—";
  return formatMatrixValue(val, field.unit);
}

export function BatchIdentityPanel({ batch }: { batch: BatchRecord }) {
  const nearest = nearestCheckpointHour(batch.fermenterAgeH);
  const next = nextCheckpointHour(batch.fermenterAgeH);
  const current = getLabReading(batch, nearest);

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Batch identity · Ferm Data dictionary
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Batch #</p>
          <p className="font-mono font-bold">{batch.id}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Fermenter</p>
          <p className="font-medium">{batch.ferm}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Yeast strain</p>
          <p className="font-medium">{batch.yeastStrain}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Corn source</p>
          <p className="font-medium">{batch.cornSource}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">YP batch</p>
          <p className="font-mono text-xs">{batch.yeastPropBatch}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Fill complete</p>
          <p className="font-medium">{batch.fillCompleteAt ?? "—"}</p>
        </div>
      </div>
      {batch.operatorNote && (
        <p className="text-sm text-muted-foreground border-l-2 border-critical/40 pl-3 leading-relaxed">
          {batch.operatorNote}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          Latest lab checkpoint: {nearest}h
          {current?.sampledAt ? ` · ${current.sampledAt}` : ""}
        </Badge>
        {next && batch.status === "active" && (
          <Badge variant="secondary">Next sample: {next}h</Badge>
        )}
        {batch.fermDropAt && (
          <Badge variant="outline">Ferm drop {batch.fermDropAt}</Badge>
        )}
      </div>
    </div>
  );
}

export function DcsLivePanel({ batch }: { batch: BatchRecord }) {
  if (batch.dcsLive.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
        DCS live panel unavailable — batch closed. See lab matrix & drop readings.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Radio className="h-3.5 w-3.5 text-primary" />
        DCS live · {batch.ferm}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {batch.dcsLive.map((sig) => (
          <div
            key={sig.signalId}
            className={cn(
              "rounded-lg border px-3 py-2.5 space-y-0.5",
              sig.status ? STATUS_STYLES[sig.status] : "border-border/60 bg-muted/20",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium">{sig.label}</p>
              {sig.status === "watch" && (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              )}
              {sig.status === "ok" && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              )}
            </div>
            <p className="text-lg font-bold tabular-nums leading-none">
              {sig.value}
              {sig.unit && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {sig.unit}
                </span>
              )}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {sig.signalId}
            </p>
            {sig.desc && (
              <p className="text-[10px] leading-snug opacity-90">{sig.desc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabCheckpointMatrix({ batch }: { batch: BatchRecord }) {
  const posted = postedCheckpoints(batch);
  const visibleColumns = FERM_CHECKPOINT_COLUMNS.filter((col) => {
    const reading = getLabReading(batch, col.key);
    return reading?.posted || batch.status === "active";
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Beaker className="h-3.5 w-3.5 text-primary" />
          Lab checkpoint matrix
        </p>
        <Badge variant="outline" className="text-[10px]">
          {posted.length} posted · Ferm Data dictionary
        </Badge>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[640px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 font-medium text-muted-foreground sticky left-0 bg-card">
                Field
              </th>
              {visibleColumns.map((col) => {
                const reading = getLabReading(batch, col.key);
                const isCurrent =
                  batch.status === "active" &&
                  typeof col.key === "number" &&
                  col.key === nearestCheckpointHour(batch.fermenterAgeH);
                return (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "text-center py-2 px-1 font-medium min-w-[52px]",
                      isCurrent && "bg-primary/10 text-primary",
                      !reading?.posted && "text-muted-foreground/50",
                    )}
                  >
                    {col.short}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FERM_MATRIX_FIELDS.map((field) => (
              <tr key={field.key} className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-muted-foreground sticky left-0 bg-card whitespace-nowrap">
                  {field.label}
                </td>
                {visibleColumns.map((col) => {
                  const reading = getLabReading(batch, col.key);
                  const value = matrixCellValue(batch, col.key, field.key);
                  const isCurrent =
                    batch.status === "active" &&
                    typeof col.key === "number" &&
                    col.key === nearestCheckpointHour(batch.fermenterAgeH);
                  return (
                    <td
                      key={`${String(col.key)}-${field.key}`}
                      className={cn(
                        "text-center py-1.5 px-1 font-mono tabular-nums",
                        !reading?.posted && "text-muted-foreground/30",
                        isCurrent && value !== "—" && "bg-primary/5 font-semibold",
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Potential = Ethanol + 0.51 × Sugars (computed per dictionary). Highlighted column =
        latest posted checkpoint for batch age ({batch.fermenterAgeH}h).
      </p>
    </div>
  );
}

export function QualityTrajectoryPanel({ batch }: { batch: BatchRecord }) {
  const hourly = postedCheckpoints(batch).filter(
    (c): c is typeof c & { checkpoint: number } => typeof c.checkpoint === "number",
  );

  if (hourly.length < 2) return null;

  const maxPot = Math.max(...hourly.map((c) => c.potential ?? 0), 1);
  const maxTemp = Math.max(...hourly.map((c) => c.temp ?? 0), 1);

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        Quality trajectory
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground mb-2">
            Potential % by checkpoint
          </p>
          <div className="flex items-end gap-1 h-16">
            {hourly.map((c) => (
              <div key={c.checkpoint} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/70 min-h-[4px]"
                  style={{
                    height: `${((c.potential ?? 0) / maxPot) * 100}%`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{c.checkpoint}h</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground mb-2">
            Temp °F by checkpoint
          </p>
          <div className="flex items-end gap-1 h-16">
            {hourly.map((c) => (
              <div key={c.checkpoint} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t min-h-[4px]",
                    (c.temp ?? 0) > 91 ? "bg-critical/70" : "bg-success/60",
                  )}
                  style={{
                    height: `${((c.temp ?? 0) / maxTemp) * 100}%`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{c.checkpoint}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlaybookWatchPanel({ batch }: { batch: BatchRecord }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        Playbook watch
      </p>
      <ul className="space-y-2">
        {batch.playbookWatch.map((item) => (
          <li
            key={item.playbook}
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
              <p className="text-sm font-medium">{item.playbook}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[9px] capitalize", STATUS_STYLES[item.status])}
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

export function PropAdditionsPanel({ batch }: { batch: BatchRecord }) {
  if (batch.propAdditions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 text-primary" />
        Prop additions · dictionary fields
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {batch.propAdditions.map((add) => (
          <div
            key={add.item}
            className="flex justify-between gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{add.item}</span>
            <span className="font-medium tabular-nums">{add.amount}</span>
          </div>
        ))}
      </div>
      {batch.propAdditions[0]?.signalId && (
        <p className="text-[10px] font-mono text-muted-foreground">
          e.g. {batch.propAdditions[0].signalId}
        </p>
      )}
    </div>
  );
}

export function YeastHealthPanel({ batch }: { batch: BatchRecord }) {
  const yp = getLabReading(batch, "yp");
  if (!yp?.posted) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5" />
        Yeast prop send (YP)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground">Cell count</p>
          <p className="font-bold tabular-nums">{yp.cellCount ?? "—"} M/mL</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Viability</p>
          <p className="font-bold tabular-nums">{yp.viability ?? "—"}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">YP potential</p>
          <p className="font-bold tabular-nums">{yp.potential?.toFixed(1) ?? "—"}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">YP acetic</p>
          <p className="font-bold tabular-nums">{yp.acetic?.toFixed(2) ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
