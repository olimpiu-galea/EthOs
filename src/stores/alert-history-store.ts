"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AlertAgendaItem, Playbook } from "@/lib/types";
import {
  backfillPlaybookAlerts,
  resolveAlertStatus,
} from "@/lib/history-backfill";
import type { DcsTimeline } from "@/lib/dcs-timeline";
import { localDateKey } from "@/lib/dcs-timeline";
import { resolveAgendaDateKey } from "@/lib/timeline-loader";

type AlertHistoryState = {
  items: AlertAgendaItem[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addLiveAlert: (
    playbook: Playbook,
    triggeredAt: number,
    conditionsSummary: string,
  ) => void;
  replacePlaybookDayAlerts: (
    playbook: Playbook,
    timeline: DcsTimeline,
    dateKey?: string,
  ) => void;
  refreshStatuses: (now?: number) => void;
};

export function isSameCalendarDay(ts: number, dateKey: string): boolean {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` === dateKey;
}

export const useAlertHistoryStore = create<AlertHistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addLiveAlert: (playbook, triggeredAt, conditionsSummary) => {
        const item: AlertAgendaItem = {
          id: crypto.randomUUID(),
          playbookId: playbook.id,
          playbookName: playbook.name,
          alertTitle: playbook.alert.title,
          alertMessage: playbook.alert.message,
          severity: playbook.alert.severity,
          triggeredAt,
          status: resolveAlertStatus(triggeredAt),
          conditionsSummary,
        };
        const dateKey = localDateKey(new Date(triggeredAt));
        set((s) => ({
          items: trimDayAlerts(
            [...s.items, item].sort((a, b) => a.triggeredAt - b.triggeredAt),
            dateKey,
          ),
        }));
      },

      replacePlaybookDayAlerts: (playbook, timeline, dateKey) => {
        const key = dateKey ?? resolveAgendaDateKey(timeline);
        const { items: backfill } = backfillPlaybookAlerts(
          playbook,
          timeline,
          key,
        );
        const fresh: AlertAgendaItem[] = backfill.map((b) => ({
          ...b,
          id: crypto.randomUUID(),
          status: resolveAlertStatus(b.triggeredAt),
        }));

        set((s) => ({
          items: trimDayAlerts(
            [
              ...s.items.filter(
                (i) =>
                  !(
                    i.playbookId === playbook.id &&
                    isSameCalendarDay(i.triggeredAt, key)
                  ),
              ),
              ...fresh,
            ].sort((a, b) => a.triggeredAt - b.triggeredAt),
            key,
          ),
        }));
      },

      refreshStatuses: (now = Date.now()) => {
        set((s) => ({
          items: s.items.map((i) => ({
            ...i,
            status: resolveAlertStatus(i.triggeredAt, now),
          })),
        }));
      },
    }),
    {
      name: "playbook-editor-alert-history",
      skipHydration: true,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => () => {
        useAlertHistoryStore.getState().setHasHydrated(true);
      },
    },
  ),
);

export const AGENDA_LATEST_LIMIT = 6;

/** Keep only the newest N alerts for a calendar day */
export function trimDayAlerts(
  items: AlertAgendaItem[],
  dateKey: string,
  limit = AGENDA_LATEST_LIMIT,
): AlertAgendaItem[] {
  const day = items.filter((i) => isSameCalendarDay(i.triggeredAt, dateKey));
  const rest = items.filter((i) => !isSameCalendarDay(i.triggeredAt, dateKey));
  const kept = day
    .sort((a, b) => b.triggeredAt - a.triggeredAt)
    .slice(0, limit)
    .sort((a, b) => a.triggeredAt - b.triggeredAt);
  return [...rest, ...kept].sort((a, b) => a.triggeredAt - b.triggeredAt);
}

export function filterItemsForDate(
  items: AlertAgendaItem[],
  dateKey: string,
): AlertAgendaItem[] {
  return items
    .filter((i) => isSameCalendarDay(i.triggeredAt, dateKey))
    .sort((a, b) => a.triggeredAt - b.triggeredAt);
}

/** Most recent alerts for today — newest first, capped for agenda view */
export function latestAgendaItems(
  items: AlertAgendaItem[],
  dateKey: string,
  limit = AGENDA_LATEST_LIMIT,
): AlertAgendaItem[] {
  return filterItemsForDate(items, dateKey)
    .sort((a, b) => b.triggeredAt - a.triggeredAt)
    .slice(0, limit);
}
