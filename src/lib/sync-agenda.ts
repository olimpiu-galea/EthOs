import { loadTimeline } from "./timeline-loader";
import { isMockPlaybook } from "./mock-playbook-alerts";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

/** Recompute today's time-based agenda entries for all playbooks */
export async function syncAllPlaybooksToAgenda(): Promise<number> {
  const timeline = await loadTimeline();
  if (!timeline) return 0;

  const playbooks = usePlaybookStore.getState().playbooks;
  const replace = useAlertHistoryStore.getState().replacePlaybookDayAlerts;

  for (const pb of playbooks) {
    if (isMockPlaybook(pb)) continue;
    replace(pb, timeline);
  }

  useAlertHistoryStore.getState().refreshStatuses();
  return useAlertHistoryStore.getState().items.length;
}
