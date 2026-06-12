"use client";



import { create } from "zustand";

import { persist } from "zustand/middleware";

import type { AlertAgendaItem, AlertLifecycle, Playbook, UserRole } from "@/lib/types";

import { ALERT_DURATION_MS, ESCALATION_THRESHOLD_MS, alertTypeLabel } from "@/lib/types";

import { backfillPlaybookAlerts } from "@/lib/history-backfill";

import type { DcsTimeline } from "@/lib/dcs-timeline";

import {
  filterAgendaItemsForDate,
  agendaNow,
  resolveAlertStatus,
} from "@/lib/agenda-time";

import { isDemoAlertItem } from "@/lib/demo-playbook";
import { isMockPlaybook } from "@/lib/mock-playbook-alerts";

import {
  applyPlaybookContentToAlert,
  enrichAlertFromPlaybook,
  migrateAlertItem,
  playbookActionItemsForAlert,
  playbookGuidanceForAlert,
} from "@/lib/alert-enrichment";

import { useAuditStore } from "@/stores/audit-store";



type AlertHistoryState = {

  items: AlertAgendaItem[];

  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;

  addLiveAlert: (

    playbook: Playbook,

    triggeredAt: number,

    conditionsSummary: string,

  ) => void;

  upsertDeskAlert: (id: string, item: Omit<AlertAgendaItem, "id">) => void;

  removeDeskAlert: (id: string) => void;

  removeAlertsForPlaybook: (playbookId: string) => void;

  replacePlaybookDayAlerts: (

    playbook: Playbook,

    timeline?: DcsTimeline | null,

  ) => void;

  refreshStatuses: (now?: number) => void;

  checkEscalations: (now?: number) => void;

  syncPlaybookContentToAlerts: (playbook: Playbook) => void;

  addComment: (id: string, body: string, author: string) => void;

  setLifecycle: (

    id: string,

    lifecycle: AlertLifecycle,

    actor: string,

    note?: string,

  ) => void;

  escalate: (id: string, actor: string) => void;

  markComplete: (id: string) => void;

  toggleActionItem: (alertId: string, actionId: string) => void;

};



export const AGENDA_LATEST_LIMIT = 48;

function isLegacyHealthAlert(item: AlertAgendaItem): boolean {
  const legacy = item as AlertAgendaItem & { isHealthAlert?: boolean };
  return (
    legacy.isHealthAlert === true ||
    item.id.startsWith("health-") ||
    item.playbookId.startsWith("health-")
  );
}

function trimPerPlaybook(

  items: AlertAgendaItem[],

  limit = AGENDA_LATEST_LIMIT,

): AlertAgendaItem[] {

  const byPlaybook = new Map<string, AlertAgendaItem[]>();

  for (const item of items) {

    const list = byPlaybook.get(item.playbookId) ?? [];

    list.push(item);

    byPlaybook.set(item.playbookId, list);

  }

  const result: AlertAgendaItem[] = [];

  for (const list of byPlaybook.values()) {

    const cap = limit;

    const kept = list

      .sort((a, b) => b.triggeredAt - a.triggeredAt)

      .slice(0, cap)

      .sort((a, b) => a.triggeredAt - b.triggeredAt);

    result.push(...kept);

  }

  return result.sort((a, b) => a.triggeredAt - b.triggeredAt);

}



function finalizeItem(item: AlertAgendaItem, now: number): AlertAgendaItem {

  const lifecycle = item.lifecycle ?? "new";

  const status = resolveAlertStatus(

    item.triggeredAt,

    now,

    item.manuallyCompleted,

    item.durationMs ?? ALERT_DURATION_MS,

    lifecycle,

  );

  return { ...item, lifecycle, status };

}



export function filterItemsForDate(
  items: AlertAgendaItem[],
  dateKey?: string,
): AlertAgendaItem[] {
  return filterAgendaItemsForDate(items, dateKey);
}



export function latestAgendaItems(

  items: AlertAgendaItem[],

  _dateKey?: string,

  limit = AGENDA_LATEST_LIMIT,

): AlertAgendaItem[] {

  return [...items]

    .sort((a, b) => b.triggeredAt - a.triggeredAt)

    .slice(0, limit);

}



export const useAlertHistoryStore = create<AlertHistoryState>()(

  persist(

    (set, get) => ({

      items: [],

      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),



      addLiveAlert: (playbook, triggeredAt, conditionsSummary) => {

        const at = triggeredAt;

        const base = enrichAlertFromPlaybook(

          {

            playbookId: playbook.id,

            playbookName: playbook.name,

            alertTitle: alertTypeLabel(playbook.alert),

            alertMessage: playbook.alert.message,

            severity: playbook.alert.severity,

            triggeredAt: at,

            durationMs: ALERT_DURATION_MS,

            status: "active",

            lifecycle: "new",

            conditionsSummary,

            actionItems: playbookActionItemsForAlert(playbook),

            guidance: playbookGuidanceForAlert(playbook),

            completedActionIds: [],

          },

          playbook,

        );

        const item: AlertAgendaItem = { ...base, id: crypto.randomUUID() };

        set((s) => {

          return {

            items: trimPerPlaybook(

              [...s.items, item].sort((a, b) => a.triggeredAt - b.triggeredAt),

            ),

          };

        });

      },



      upsertDeskAlert: (id, item) => {

        const fresh: AlertAgendaItem = {

          ...item,

          id,

          lifecycle: item.lifecycle ?? "new",

        };

        set((s) => ({

          items: trimPerPlaybook([

            ...s.items.filter((i) => i.id !== id),

            fresh,

          ]),

        }));

      },



      removeDeskAlert: (id) =>

        set((s) => ({

          items: s.items.filter((i) => i.id !== id),

        })),

      removeAlertsForPlaybook: (playbookId) =>

        set((s) => ({

          items: s.items.filter((i) => i.playbookId !== playbookId),

        })),

      replacePlaybookDayAlerts: (playbook, timeline) => {
        if (isMockPlaybook(playbook)) return;

        let source: Omit<AlertAgendaItem, "id" | "status">[];

        if (timeline) {

          const { items: backfill } = backfillPlaybookAlerts(

            playbook,

            timeline,

          );

          source = backfill;

        } else {

          source = [];

        }



        const fresh: AlertAgendaItem[] = source.map((b) => {

          const enriched = enrichAlertFromPlaybook(b, playbook);

          return finalizeItem(

            {

              ...enriched,

              id: crypto.randomUUID(),

              durationMs: enriched.durationMs ?? ALERT_DURATION_MS,

              status: resolveAlertStatus(

                enriched.triggeredAt,

                agendaNow(),

                enriched.manuallyCompleted,

                enriched.durationMs ?? ALERT_DURATION_MS,

                enriched.lifecycle,

              ),

              completedActionIds: enriched.completedActionIds ?? [],

            },

            agendaNow(),

          );

        });



        set((s) => ({

          items: trimPerPlaybook(

            [

              ...s.items.filter((i) => i.playbookId !== playbook.id),

              ...fresh,

            ].sort((a, b) => a.triggeredAt - b.triggeredAt),

          ),

        }));

      },



      refreshStatuses: (now = agendaNow()) => {

        set((s) => ({

          items: s.items.map((i) => finalizeItem(migrateAlertItem(i), now)),

        }));

      },



      syncPlaybookContentToAlerts: (playbook) => {

        set((s) => ({

          items: s.items.map((item) => {

            if (item.playbookId !== playbook.id) {

              return item;

            }

            return applyPlaybookContentToAlert(item, playbook, {

              preserveAlertMessage: Boolean(item.isMockAlert),

            });

          }),

        }));

      },



      addComment: (id, body, author) => {

        const trimmed = body.trim();

        if (!trimmed) return;

        const comment = {

          id: crypto.randomUUID(),

          body: trimmed,

          author,

          at: agendaNow(),

        };

        useAuditStore.getState().log({

          alertId: id,

          action: "Comment",

          actor: author,

          note: trimmed,

        });

        set((s) => ({

          items: s.items.map((i) =>

            i.id !== id

              ? i

              : { ...i, comments: [...(i.comments ?? []), comment] },

          ),

        }));

      },



      checkEscalations: (now = agendaNow()) => {

        set((s) => ({

          items: s.items.map((i) => {

            if (i.severity !== "critical") return i;

            if (i.lifecycle === "resolved" || i.lifecycle === "false_alarm") {

              return i;

            }

            if (

              i.lifecycle !== "new" &&

              i.lifecycle !== "acknowledged"

            ) {

              return i;

            }

            const age = now - i.triggeredAt;

            if (age < ESCALATION_THRESHOLD_MS) return i;

            if ((i.escalationLevel ?? 0) >= 1) return i;



            useAuditStore.getState().log({

              alertId: i.id,

              playbookId: i.playbookId,

              action: "Auto-escalated to supervisor",

              actor: "System",

              note: `Critical alert unacknowledged after ${Math.round(age / 60_000)} min`,

            });



            return {

              ...i,

              escalationLevel: 1,

              assignedRole: "supervisor" as UserRole,

            };

          }),

        }));

      },



      setLifecycle: (id, lifecycle, actor, note) => {

        useAuditStore.getState().log({

          alertId: id,

          action: `Lifecycle → ${lifecycle}`,

          actor,

          note,

        });

        set((s) => ({

          items: s.items.map((i) => {

            if (i.id !== id) return i;

            const resolved =

              lifecycle === "resolved" || lifecycle === "false_alarm";

            return finalizeItem(

              {

                ...i,

                lifecycle,

                manuallyCompleted: resolved ? true : i.manuallyCompleted,

                completedAt: resolved ? agendaNow() : i.completedAt,

              },

              agendaNow(),

            );

          }),

        }));

      },



      escalate: (id, actor) => {

        useAuditStore.getState().log({

          alertId: id,

          action: "Manual escalation",

          actor,

          note: "Assigned to supervisor",

        });

        set((s) => ({

          items: s.items.map((i) =>

            i.id === id

              ? {

                  ...i,

                  escalationLevel: (i.escalationLevel ?? 0) + 1,

                  assignedRole: "supervisor" as UserRole,

                }

              : i,

          ),

        }));

      },



      markComplete: (id) => {

        get().setLifecycle(id, "resolved", "User");

      },



      toggleActionItem: (alertId, actionId) =>

        set((s) => ({

          items: s.items.map((i) => {

            if (i.id !== alertId) return i;

            const completed = i.completedActionIds ?? [];
            const done = completed.includes(actionId);

            return {

              ...i,

              completedActionIds: done

                ? completed.filter((x) => x !== actionId)

                : [...completed, actionId],

            };

          }),

        })),

    }),

    {

      name: "playbook-editor-alert-history",

      version: 9,

      skipHydration: true,

      partialize: (s) => ({ items: s.items }),

      migrate: (persisted: unknown) => {

        const raw = persisted as { items?: AlertAgendaItem[] };

        const now = agendaNow();

        return {

          items: (raw.items ?? [])

            .filter((i) => !isDemoAlertItem(i) && !isLegacyHealthAlert(i))

            .map((i) => finalizeItem(migrateAlertItem(i), now)),

        };

      },

      onRehydrateStorage: () => (state) => {

        if (state?.items?.length) {

          useAlertHistoryStore.getState().refreshStatuses();

        }

        useAlertHistoryStore.getState().setHasHydrated(true);

      },

    },

  ),

);


