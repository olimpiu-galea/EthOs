import type { Playbook } from "./types";
import { loadTimeline, resolveAgendaDateKey } from "./timeline-loader";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

/** Recalculate agenda alerts for one playbook (today / latest demo day) */
export async function runPlaybookBackfill(playbook: Playbook): Promise<void> {
  const timeline = await loadTimeline();
  if (!timeline) return;

  const dateKey = resolveAgendaDateKey(timeline);
  useAlertHistoryStore
    .getState()
    .replacePlaybookDayAlerts(playbook, timeline, dateKey);
  useAlertHistoryStore.getState().refreshStatuses();
}
