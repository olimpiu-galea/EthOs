"use client";

import type { AlertAgendaItem, Playbook } from "./types";

/** Legacy daily demo playbook — purged on boot */
const LEGACY_DAILY_DEMO_BUILTIN_ID = "daily-shift-checkpoint";
const LEGACY_DAILY_DEMO_PLAYBOOK_NAME = "Demo alarm";

/** Legacy demo playbook names — used only to purge persisted leftovers */
const DEMO_PLAYBOOK_NAMES = new Set([
  "Demo — operations alert (fermenter)",
  "Demo — live alert each refresh",
  "Demo — maintenance alert (utilities)",
  "Demo — financial alert (Financial)",
  "Demo — financial alert (financial feed)",
  "Demo — procurement alert (corn basis)",
  "Demo — QA lab alert (Brix)",
  "Demo — lab quality alert",
  LEGACY_DAILY_DEMO_PLAYBOOK_NAME,
]);

export function isLegacyDailyDemoPlaybook(
  playbook: Pick<Playbook, "name" | "builtinId">,
): boolean {
  return (
    playbook.builtinId === LEGACY_DAILY_DEMO_BUILTIN_ID ||
    playbook.name === LEGACY_DAILY_DEMO_PLAYBOOK_NAME
  );
}

export function isDemoPlaybook(
  playbook: Pick<Playbook, "name" | "builtinId">,
): boolean {
  return (
    DEMO_PLAYBOOK_NAMES.has(playbook.name) || isLegacyDailyDemoPlaybook(playbook)
  );
}

export function isLegacyDailyDemoAlert(
  item: Pick<AlertAgendaItem, "playbookName" | "mockAlertKey">,
): boolean {
  return (
    item.playbookName === LEGACY_DAILY_DEMO_PLAYBOOK_NAME ||
    item.mockAlertKey?.startsWith("daily-demo-") === true ||
    item.mockAlertKey?.startsWith("daily-demo-shift-") === true
  );
}

export function isDemoAlertItem(
  item: Pick<AlertAgendaItem, "playbookName" | "mockAlertKey">,
): boolean {
  return isDemoPlaybook({ name: item.playbookName }) || isLegacyDailyDemoAlert(item);
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
