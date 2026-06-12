import type { Playbook } from "./types";
import { loadTimeline } from "./timeline-loader";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

/** Recalculate time-based agenda alerts for one playbook */
export async function runPlaybookBackfill(playbook: Playbook): Promise<void> {
  const timeline = await loadTimeline();
  if (!timeline) return;

  useAlertHistoryStore
    .getState()
    .replacePlaybookDayAlerts(playbook, timeline);
  useAlertHistoryStore.getState().refreshStatuses();
}
