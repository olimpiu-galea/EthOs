import type { DcsTimeline } from "./dcs-timeline";
import { isMockPlaybook } from "./mock-playbook-alerts";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

export function schedulePlaybookHistorySync(
  timeline: DcsTimeline,
  onDone?: () => void,
) {
  const playbooks = usePlaybookStore.getState().playbooks;

  const run = () => {
    try {
      const replace = useAlertHistoryStore.getState().replacePlaybookDayAlerts;
      for (const pb of playbooks) {
        if (isMockPlaybook(pb)) continue;
        replace(pb, timeline);
      }
      useAlertHistoryStore.getState().refreshStatuses();
    } finally {
      onDone?.();
    }
  };

  setTimeout(run, 0);
}
