import type { DcsTimeline } from "./dcs-timeline";
import { localDateKey } from "./dcs-timeline";
import { useDcsStore } from "@/stores/dcs-store";

let cachedTimeline: DcsTimeline | null = null;

export async function loadTimeline(): Promise<DcsTimeline | null> {
  const fromStore = useDcsStore.getState().getTimeline();
  if (fromStore) return fromStore;
  if (cachedTimeline) return cachedTimeline;
  try {
    const res = await fetch("/fixtures/dcs-tags-timeline.json");
    if (!res.ok) return null;
    cachedTimeline = (await res.json()) as DcsTimeline;
    return cachedTimeline;
  } catch {
    return null;
  }
}

/** Today if present in timeline, otherwise the latest available demo day */
export function resolveAgendaDateKey(timeline: DcsTimeline): string {
  const today = localDateKey();
  if (timeline.days[today]) return today;
  const keys = Object.keys(timeline.days).sort();
  return keys[keys.length - 1] ?? today;
}
