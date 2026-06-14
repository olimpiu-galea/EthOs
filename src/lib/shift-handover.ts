import { getActiveBatch } from "@/lib/batch-context";
import type { AlertAgendaItem } from "@/lib/types";

export const SHIFT_HANDOVER_HOURS = 12;

export const SHIFT_BAND_OPTIONS = [
  "Day — 06:00–18:00",
  "Night — 18:00–06:00",
] as const;

export type ShiftBandId = "day" | "night";

/** Handover is filed at each 12h shift change */
export const SHIFT_CHANGE_HOURS = [6, 18] as const;

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

export function shiftBandForTime(ts: number): (typeof SHIFT_BAND_OPTIONS)[number] {
  const hour = new Date(ts).getHours();
  if (hour >= 6 && hour < 18) return SHIFT_BAND_OPTIONS[0];
  return SHIFT_BAND_OPTIONS[1];
}

export function shiftBandIdForTime(ts: number): ShiftBandId {
  const hour = new Date(ts).getHours();
  if (hour >= 6 && hour < 18) return "day";
  return "night";
}

export function shiftBandLabel(id: ShiftBandId): (typeof SHIFT_BAND_OPTIONS)[number] {
  return id === "day" ? SHIFT_BAND_OPTIONS[0] : SHIFT_BAND_OPTIONS[1];
}

export function nextShiftBand(
  current: string,
): (typeof SHIFT_BAND_OPTIONS)[number] {
  const i = SHIFT_BAND_OPTIONS.indexOf(current as (typeof SHIFT_BAND_OPTIONS)[number]);
  if (i < 0) return SHIFT_BAND_OPTIONS[0];
  return SHIFT_BAND_OPTIONS[(i + 1) % SHIFT_BAND_OPTIONS.length];
}

/** Start of the 12h shift window that contains `now` */
export function currentShiftStartMs(now = Date.now()): number {
  const d = new Date(now);
  const hour = d.getHours();
  if (hour >= 6 && hour < 18) {
    d.setHours(6, 0, 0, 0);
  } else if (hour >= 18) {
    d.setHours(18, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - 1);
    d.setHours(18, 0, 0, 0);
  }
  return d.getTime();
}

export function previousShiftStartMs(now = Date.now()): number {
  return currentShiftStartMs(now) - SHIFT_HANDOVER_HOURS * 60 * 60 * 1000;
}

export function shiftReportTitle(createdAt: number): string {
  const band = shiftBandForTime(createdAt);
  const shortBand = band.startsWith("Day") ? "Day" : "Night";
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `SHO — ${shortBand} · ${date}`;
}

/** Outgoing band when filing a handover (handles 06:00 / 18:00 changeover) */
export function outgoingShiftForHandover(now = Date.now()): (typeof SHIFT_BAND_OPTIONS)[number] {
  const d = new Date(now);
  const h = d.getHours();
  const m = d.getMinutes();
  const nearChange = (h === 6 || h === 18) && m < 45;
  if (nearChange) {
    return nextShiftBand(shiftBandForTime(currentShiftStartMs(now)));
  }
  return shiftBandForTime(now);
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
  const outgoingShift = outgoingShiftForHandover(now);
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
