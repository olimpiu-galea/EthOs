"use client";

import type { AlertAgendaItem, Playbook } from "./types";

/** Legacy demo playbook names — used only to purge persisted leftovers */
const DEMO_PLAYBOOK_NAMES = new Set([
  "Demo — operations alert (fermenter)",
  "Demo — live alert each refresh",
  "Demo — maintenance alert (utilities)",
  "Demo — financial alert (margin desk)",
  "Demo — financial alert (commodity)",
  "Demo — procurement alert (corn basis)",
  "Demo — QA lab alert (Brix)",
  "Demo — lab quality alert",
]);

export function isDemoPlaybook(playbook: Pick<Playbook, "name">): boolean {
  return DEMO_PLAYBOOK_NAMES.has(playbook.name);
}

export function isDemoAlertItem(
  item: Pick<AlertAgendaItem, "playbookName">,
): boolean {
  return isDemoPlaybook({ name: item.playbookName });
}

/** Remove legacy demo playbooks and their agenda alerts from persisted stores */
export async function purgeDemoPlaybooks(): Promise<void> {
  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { useAlertHistoryStore } = await import("@/stores/alert-history-store");

  const playbooks = usePlaybookStore.getState().playbooks;
  const demoIds = new Set(
    playbooks.filter(isDemoPlaybook).map((p) => p.id),
  );
  const items = useAlertHistoryStore.getState().items;
  const hasDemoAlerts = items.some(
    (i) => demoIds.has(i.playbookId) || isDemoAlertItem(i),
  );

  if (!demoIds.size && !hasDemoAlerts) return;

  if (demoIds.size) {
    usePlaybookStore.setState({
      playbooks: playbooks.filter((p) => !isDemoPlaybook(p)),
    });
  }

  if (hasDemoAlerts) {
    useAlertHistoryStore.setState((s) => ({
      items: s.items.filter(
        (i) => !demoIds.has(i.playbookId) && !isDemoAlertItem(i),
      ),
    }));
  }
}
