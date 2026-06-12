import { getActiveBatch } from "@/lib/batch-context";
import type { AlertAgendaItem } from "@/lib/types";

export const SHIFT_HANDOVER_HOURS = 8;

export const SHIFT_BAND_OPTIONS = [
  "Day A — 06:00–14:00",
  "Day B — 14:00–22:00",
  "Night — 22:00–06:00",
] as const;

/** Fields auto-filled from alert selection — not editable in handover modal */
export const SHIFT_READONLY_FIELDS = new Set([
  "alarmsSummary",
  "openAlerts",
  "pendingActions",
  "batchStatus",
]);

export const SHIFT_HANDOVER_CHECKLIST = [
  { id: "dcs", label: "DCS alarm log reviewed" },
  { id: "lab", label: "Scheduled lab samples posted" },
  { id: "utilities", label: "Steam / NG / power stable" },
  { id: "walkdown", label: "Fermenter area walkdown complete" },
  { id: "interlocks", label: "No active safety interlocks bypassed" },
] as const;

function shiftNameForTime(now: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 6 && hour < 14) return SHIFT_BAND_OPTIONS[0];
  if (hour >= 14 && hour < 22) return SHIFT_BAND_OPTIONS[1];
  return SHIFT_BAND_OPTIONS[2];
}

export function nextShiftBand(current: string): string {
  const i = SHIFT_BAND_OPTIONS.indexOf(current as (typeof SHIFT_BAND_OPTIONS)[number]);
  if (i < 0) return SHIFT_BAND_OPTIONS[0];
  return SHIFT_BAND_OPTIONS[(i + 1) % SHIFT_BAND_OPTIONS.length];
}

export function formatAlertHandoverLine(a: AlertAgendaItem): string {
  const time = new Date(a.triggeredAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `• [${a.severity}] ${a.playbookName} — ${a.alertTitle} (${a.lifecycle}) @ ${time}`;
}

function buildAlarmsSummary(selected: AlertAgendaItem[]): string {
  const open = selected.filter(
    (a) => a.lifecycle !== "resolved" && a.lifecycle !== "false_alarm",
  );
  const critical = open.filter((a) => a.severity === "critical");
  const warning = open.filter((a) => a.severity === "warning");
  const acknowledged = selected.filter((a) => a.lifecycle === "acknowledged");

  if (selected.length === 0) return "No alerts selected for handover.";

  return [
    `${selected.length} alert(s) in pack · ${open.length} still open`,
    critical.length
      ? `${critical.length} CRITICAL require incoming shift acknowledgment`
      : "No critical alarms in selection",
    warning.length ? `${warning.length} warning(s) open` : null,
    acknowledged.length
      ? `${acknowledged.length} acknowledged and monitoring`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPendingActions(open: AlertAgendaItem[]): string {
  const lines = open.flatMap((a) =>
    a.actionItems
      .filter((item) => !a.completedActionIds.includes(item.id))
      .map((item) => `• ${item.title} — ${a.playbookName}`),
  );
  return lines.length ? lines.join("\n") : "No open playbook actions on selected alerts.";
}

function buildBatchStatus(): string {
  const batch = getActiveBatch();
  if (!batch) return "No active fermenter batch in fixture.";
  const phase =
    batch.phases.find((p) => p.status === "active")?.label ?? "active";
  return [
    `${batch.id} · ${batch.ferm}`,
    `${batch.fermenterAgeH}h elapsed · phase: ${phase}`,
    `${batch.bushelsCharged.toLocaleString()} bu · ${batch.projectedGalPerBu.toFixed(2)} gal/bu proj.`,
    batch.status === "deviation" ? "Status: DEVIATION — review before release" : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildReadinessChecklist(checked: string[]): string {
  if (checked.length === 0) return "";
  return checked
    .map((id) => {
      const item = SHIFT_HANDOVER_CHECKLIST.find((c) => c.id === id);
      return item ? `✓ ${item.label}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildShiftHandoverFields(
  selectedAlerts: AlertAgendaItem[],
  opts: {
    now?: number;
    preparedBy?: string;
    incomingShift?: string;
    plantStatus?: string;
    shiftWalkthrough?: string;
    prioritiesNextShift?: string;
    additionalNotes?: string;
    readinessChecklist?: string;
  } = {},
): Record<string, string> {
  const now = opts.now ?? Date.now();
  const outgoingShift = shiftNameForTime(now);
  const open = selectedAlerts.filter(
    (a) => a.lifecycle !== "resolved" && a.lifecycle !== "false_alarm",
  );

  return {
    preparedBy: opts.preparedBy ?? "",
    outgoingShift,
    incomingShift: opts.incomingShift ?? nextShiftBand(outgoingShift),
    plantStatus: opts.plantStatus ?? "",
    shiftWalkthrough: opts.shiftWalkthrough ?? "",
    readinessChecklist: opts.readinessChecklist ?? "",
    alarmsSummary: buildAlarmsSummary(selectedAlerts),
    openAlerts: selectedAlerts.length
      ? selectedAlerts.map(formatAlertHandoverLine).join("\n")
      : "No alerts selected",
    pendingActions: buildPendingActions(open),
    batchStatus: buildBatchStatus(),
    prioritiesNextShift: opts.prioritiesNextShift ?? "",
    additionalNotes: opts.additionalNotes ?? "",
  };
}

export function alertsInShiftWindow(
  alerts: AlertAgendaItem[],
  now = Date.now(),
): AlertAgendaItem[] {
  const windowStart = now - SHIFT_HANDOVER_HOURS * 60 * 60 * 1000;
  return alerts.filter((a) => a.triggeredAt >= windowStart);
}
