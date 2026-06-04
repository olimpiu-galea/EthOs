import { loadTimeline, resolveAgendaDateKey } from "./timeline-loader";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

/** Recompute today's agenda entries for all playbooks */
export async function syncAllPlaybooksToAgenda(): Promise<number> {
  const timeline = await loadTimeline();
  if (!timeline) return 0;

  const dateKey = resolveAgendaDateKey(timeline);
  const playbooks = usePlaybookStore.getState().playbooks;
  const replace = useAlertHistoryStore.getState().replacePlaybookDayAlerts;

  for (const pb of playbooks) {
    replace(pb, timeline, dateKey);
  }

  useAlertHistoryStore.getState().refreshStatuses();
  return useAlertHistoryStore.getState().items.filter((i) => {
    const d = new Date(i.triggeredAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}` === dateKey;
  }).length;
}
