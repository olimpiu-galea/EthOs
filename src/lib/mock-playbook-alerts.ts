"use client";

import type { AlertAgendaItem, Playbook, PlaybookActionItem, PlaybookGuidanceStep } from "./types";
import { alertTypeLabel } from "./types";
import { ALERT_DURATION_MS } from "./types";
import {
  enrichAlertFromPlaybook,
  playbookActionItemsForAlert,
  playbookGuidanceForAlert,
} from "./alert-enrichment";
import { agendaNow, resolveAlertStatus } from "./agenda-time";
import {
  ACETIC_ACTION_ITEMS,
  ACETIC_GUIDANCE,
} from "./default-playbook-response-acetic";
import {
  POTENTIAL_VS_TEMP_ACTION_ITEMS,
  POTENTIAL_VS_TEMP_GUIDANCE,
} from "./default-playbook-response-potential-temp";
import {
  DAILY_DEMO_ACTION_ITEMS,
  DAILY_DEMO_GUIDANCE,
} from "./default-playbook-response-daily-demo";
import { isLabSheetReady } from "./lab-sheet-availability";
import { ACETIC_BUILTIN_ID } from "./acetic-rules";
import { POTENTIAL_VS_TEMP_BUILTIN_ID } from "./potential-vs-temp-rules";
import {
  DAILY_DEMO_BUILTIN_ID,
  DAILY_DEMO_PLAYBOOK_NAME,
} from "./daily-demo-alarm-rules";
import { mapDailyDemoAlertsForYear } from "./daily-demo-alerts-adapter";
import { mapAceticAlerts } from "./acetic-alerts-adapter";
import {
  mapPotentialTempAlerts,
  type MappedPotentialTempAlert,
} from "./potential-temp-alerts-adapter";
import aceticAlertsRaw from "@mockAlerts/AceticAlerts.json";
import potentialTempAlertsRaw from "@mockAlerts/PotentialTempAlerts.json";

type MappedMockAlert = MappedPotentialTempAlert;

const MOCK_DEFAULTS: Record<
  string,
  { actionItems: PlaybookActionItem[]; guidance: PlaybookGuidanceStep[] }
> = {
  [POTENTIAL_VS_TEMP_BUILTIN_ID]: {
    actionItems: POTENTIAL_VS_TEMP_ACTION_ITEMS,
    guidance: POTENTIAL_VS_TEMP_GUIDANCE,
  },
  [ACETIC_BUILTIN_ID]: {
    actionItems: ACETIC_ACTION_ITEMS,
    guidance: ACETIC_GUIDANCE,
  },
  [DAILY_DEMO_BUILTIN_ID]: {
    actionItems: DAILY_DEMO_ACTION_ITEMS,
    guidance: DAILY_DEMO_GUIDANCE,
  },
};

const MOCK_DATASETS: Record<string, MappedMockAlert[]> = {
  [POTENTIAL_VS_TEMP_BUILTIN_ID]: mapPotentialTempAlerts(
    potentialTempAlertsRaw as import("./potential-temp-alerts-adapter").PotentialTempAlertRecord[],
  ),
  [ACETIC_BUILTIN_ID]: mapAceticAlerts(
    aceticAlertsRaw as import("./acetic-alerts-adapter").AceticAlertRecord[],
  ),
};

export function isMockPlaybook(
  playbook: Pick<Playbook, "builtinId">,
): boolean {
  if (playbook.builtinId === DAILY_DEMO_BUILTIN_ID) return true;
  return (
    playbook.builtinId != null && playbook.builtinId in MOCK_DATASETS
  );
}

export function isLabRequiredMockPlaybook(
  playbook: Pick<Playbook, "builtinId">,
): boolean {
  return isMockPlaybook(playbook) && playbook.builtinId !== DAILY_DEMO_BUILTIN_ID;
}

function mockRecordsForPlaybook(playbook: Playbook): MappedMockAlert[] {
  if (!playbook.builtinId) return [];
  if (playbook.builtinId === DAILY_DEMO_BUILTIN_ID) {
    return mapDailyDemoAlertsForYear();
  }
  return MOCK_DATASETS[playbook.builtinId] ?? [];
}

function recordToAgendaItem(
  record: MappedMockAlert,
  playbook: Playbook,
  now = agendaNow(),
): AlertAgendaItem {
  const defaults = playbook.builtinId
    ? MOCK_DEFAULTS[playbook.builtinId]
    : undefined;
  const triggeredAt = record.triggeredAt;
  const durationMs = record.durationMs ?? ALERT_DURATION_MS;
  const base = enrichAlertFromPlaybook(
    {
      playbookId: playbook.id,
      playbookName: playbook.name,
      alertTitle: alertTypeLabel(playbook.alert),
      alertMessage: record.alertMessage,
      severity: playbook.alert.severity,
      triggeredAt,
      durationMs,
      lifecycle: "new",
      conditionsSummary: record.conditionsSummary,
      actionItems: playbookActionItemsForAlert(
        playbook,
        defaults?.actionItems ?? [],
      ),
      guidance: playbookGuidanceForAlert(playbook, defaults?.guidance ?? []),
      completedActionIds: [],
      batchContext: record.batchContext,
      isMockAlert: true,
      mockAlertKey: record.mockAlertKey,
    },
    playbook,
  );

  return {
    ...base,
    id: `mock-${record.mockAlertKey}`,
    status: resolveAlertStatus(
      triggeredAt,
      now,
      false,
      durationMs,
      "new",
    ),
  };
}

/** Inject or remove pre-computed alerts for a mock playbook */
export async function syncMockPlaybookAlerts(playbook: Playbook): Promise<void> {
  const { useAlertHistoryStore } = await import("@/stores/alert-history-store");
  const store = useAlertHistoryStore.getState();

  const otherItems = store.items.filter(
    (i) => i.playbookId !== playbook.id || !i.isMockAlert,
  );

  if (!isMockPlaybook(playbook)) {
    useAlertHistoryStore.setState({ items: otherItems });
    return;
  }

  if (isLabRequiredMockPlaybook(playbook) && !isLabSheetReady()) {
    useAlertHistoryStore.setState({ items: otherItems });
    return;
  }

  const records = mockRecordsForPlaybook(playbook);
  const existingByKey = new Map(
    store.items
      .filter(
        (i) =>
          i.playbookId === playbook.id && i.isMockAlert && i.mockAlertKey,
      )
      .map((i) => [i.mockAlertKey!, i] as const),
  );

  const fresh = records.map((r) => {
    const item = recordToAgendaItem(r, playbook);
    const prev = existingByKey.get(r.mockAlertKey);
    if (!prev) return item;

    const validIds = new Set(item.actionItems.map((a) => a.id));
    return {
      ...item,
      lifecycle: prev.lifecycle,
      manuallyCompleted: prev.manuallyCompleted,
      completedAt: prev.completedAt,
      escalationLevel: prev.escalationLevel,
      assignedRole: prev.assignedRole,
      completedActionIds: (prev.completedActionIds ?? []).filter((id) =>
        validIds.has(id),
      ),
      comments: prev.comments,
    };
  });

  useAlertHistoryStore.setState({
    items: [...otherItems, ...fresh].sort(
      (a, b) => a.triggeredAt - b.triggeredAt,
    ),
  });
}

export async function syncAllMockPlaybookAlerts(
  playbooks: Playbook[],
): Promise<void> {
  for (const pb of playbooks.filter(isMockPlaybook)) {
    await syncMockPlaybookAlerts(pb);
  }
}
