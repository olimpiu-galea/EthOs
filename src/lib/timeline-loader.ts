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

/** Agenda always uses the real calendar day; fixture data is remapped at read time */
export function resolveAgendaDateKey(_timeline?: DcsTimeline): string {
  return localDateKey();
}
