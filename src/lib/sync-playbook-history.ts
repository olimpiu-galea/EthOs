import type { DcsTimeline } from "./dcs-timeline";
import { resolveAgendaDateKey } from "./timeline-loader";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";

export function schedulePlaybookHistorySync(
  timeline: DcsTimeline,
  onDone?: () => void,
) {
  const dateKey = resolveAgendaDateKey(timeline);
  const playbooks = usePlaybookStore.getState().playbooks;

  const run = () => {
    try {
      const replace = useAlertHistoryStore.getState().replacePlaybookDayAlerts;
      for (const pb of playbooks) {
        replace(pb, timeline, dateKey);
      }
      useAlertHistoryStore.getState().refreshStatuses();
    } finally {
      onDone?.();
    }
  };

  setTimeout(run, 0);
}
