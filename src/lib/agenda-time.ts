import type { AlertAgendaItem } from "./types";
import { ALERT_DURATION_MS } from "./types";
import { localDateKey } from "./dcs-timeline";

export function agendaTodayKey(): string {
  return localDateKey(new Date());
}

export function agendaNow(): number {
  return Date.now();
}

export function alertHour(ts: number): number {
  return new Date(ts).getHours();
}

/** Agenda row for the clock hour when the alert fired (not duration spillover) */
export function alertInHour(item: AlertAgendaItem, hour: number): boolean {
  return alertHour(item.triggeredAt) === hour;
}

export function filterAgendaItems(items: AlertAgendaItem[]): AlertAgendaItem[] {
  return [...items].sort((a, b) => a.triggeredAt - b.triggeredAt);
}

export function dateKeyFromTimestamp(ts: number): string {
  return localDateKey(new Date(ts));
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return localDateKey(date);
}

export function clampDateKey(
  dateKey: string,
  minKey?: string,
  maxKey?: string,
): string {
  let key = dateKey;
  if (minKey && key < minKey) key = minKey;
  if (maxKey && key > maxKey) key = maxKey;
  return key;
}

export function formatAgendaDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function filterAgendaItemsForDate(
  items: AlertAgendaItem[],
  dateKey: string = localDateKey(),
): AlertAgendaItem[] {
  return items
    .filter((i) => dateKeyFromTimestamp(i.triggeredAt) === dateKey)
    .sort((a, b) => a.triggeredAt - b.triggeredAt);
}

export function resolveAlertStatus(
  triggeredAt: number,
  now: number = agendaNow(),
  manuallyCompleted?: boolean,
  durationMs: number = ALERT_DURATION_MS,
  lifecycle?: AlertAgendaItem["lifecycle"],
): AlertAgendaItem["status"] {
  if (
    manuallyCompleted ||
    lifecycle === "resolved" ||
    lifecycle === "false_alarm"
  ) {
    return "completed";
  }
  return now >= triggeredAt + durationMs ? "completed" : "active";
}
