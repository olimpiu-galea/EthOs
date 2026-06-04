import type { DcsTag, DcsTagWithKey } from "./types";
import { numericValue } from "./dcs-parser";
import type { TagBufferMap } from "./rule-evaluator";
import { tagKey } from "./dcs-parser";

export type TimelineTagMeta = Omit<DcsTag, "value">;

export type TimelineDay = {
  date: string;
  minutes: number;
  valuesByKey: Record<string, number[]>;
  /** @deprecated legacy field */
  startIso?: string;
};

function dayStartMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

export type DcsTimeline = {
  intervalMinutes: number;
  tags: TimelineTagMeta[];
  days: Record<string, TimelineDay>;
};

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tagsAtMinute(
  timeline: DcsTimeline,
  dateKey: string,
  minuteIndex: number,
): DcsTagWithKey[] {
  const day = timeline.days[dateKey];
  if (!day) return [];

  return timeline.tags.map((meta, i) => {
    const key = `${meta.id}::${meta.displayLabel}`;
    const series = day.valuesByKey[key];
    const value = series?.[minuteIndex] ?? 0;
    return {
      ...meta,
      value,
      _key: `${key}::${i}`,
    };
  });
}

export function minuteToMs(day: TimelineDay, minuteIndex: number): number {
  return dayStartMs(day.date) + minuteIndex * 60_000;
}

/** Append one minute of readings to buffers (O(tags)) — use in loops instead of rebuild */
export function appendMinuteToBuffers(
  buffers: TagBufferMap,
  tags: DcsTagWithKey[],
  timestamp: number,
): TagBufferMap {
  const next: TagBufferMap = { ...buffers };
  for (const tag of tags) {
    const key = tagKey(tag);
    const val = numericValue(tag.value);
    const existing = next[key] ?? [];
    next[key] = [...existing, { value: val, timestamp }];
  }
  return next;
}

export function buildBuffersUpTo(
  timeline: DcsTimeline,
  dateKey: string,
  upToMinuteIndex: number,
): TagBufferMap {
  const day = timeline.days[dateKey];
  if (!day) return {};

  let buffers: TagBufferMap = {};
  for (let m = 0; m <= upToMinuteIndex; m++) {
    const ts = minuteToMs(day, m);
    const snapshot = tagsAtMinute(timeline, dateKey, m);
    buffers = appendMinuteToBuffers(buffers, snapshot, ts);
  }

  return buffers;
}

export function currentMinuteIndex(day: TimelineDay, now = Date.now()): number {
  const start = dayStartMs(day.date);
  const elapsed = now - start;
  const idx = Math.floor(elapsed / 60_000);
  return Math.max(0, Math.min(day.minutes - 1, idx));
}

export function syncTagsToMinute(
  baseTags: DcsTagWithKey[],
  timeline: DcsTimeline,
  dateKey: string,
  minuteIndex: number,
): DcsTagWithKey[] {
  const day = timeline.days[dateKey];
  if (!day) return baseTags;

  return baseTags.map((t) => {
    const key = `${t.id}::${t.displayLabel}`;
    const series = day.valuesByKey[key];
    const v = series?.[minuteIndex];
    return v !== undefined ? { ...t, value: v } : t;
  });
}
