"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyPlaybook, Playbook, PlaybookAlert } from "@/lib/types";
import { migratePlaybook, normalizePlaybookAlert } from "@/lib/playbook-migrate";
import { createPotentialVsTempPlaybook } from "@/lib/default-playbooks";
import { createEmptyCondition } from "@/lib/playbook-utils";
import { isDemoPlaybook } from "@/lib/demo-playbook";
import {
  isLabGatedMockPlaybook,
  isLabSheetReady,
} from "@/lib/lab-sheet-availability";
import { POTENTIAL_VS_TEMP_BUILTIN_ID } from "@/lib/potential-vs-temp-rules";
import { inferTeamIdFromPlaybook } from "@/lib/teams";
import { useSettingsStore } from "@/stores/settings-store";
type PlaybookState = {
  playbooks: Playbook[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addPlaybook: (playbook: Omit<Playbook, "id">) => string;
  updatePlaybook: (id: string, patch: Partial<Playbook>) => void;
  deletePlaybook: (id: string) => void;
  toggleStatus: (id: string) => void;
  markTriggered: (id: string, at: number) => void;
};

export function createEmptyPlaybook(): Omit<Playbook, "id"> {
  return {
    name: "",
    description: "",
    status: "disabled",
    conditions: [createEmptyCondition()],
    matchMode: "all",
    actionItems: [],
    guidance: [],
    alert: {
      type: "predefined",
      predefinedId: "warning",
      title: "Warning",
      message: "Investigate within 1 hour",
      severity: "warning",
    },
  };
}

export function defaultAlertFromPredefined(id: string): PlaybookAlert {
  const map: Record<string, PlaybookAlert> = {
    critical: {
      type: "predefined",
      predefinedId: "critical",
      title: "Critical",
      message: "Operator action required",
      severity: "critical",
    },
    warning: {
      type: "predefined",
      predefinedId: "warning",
      title: "Warning",
      message: "Investigate within 1 hour",
      severity: "warning",
    },
    info: {
      type: "predefined",
      predefinedId: "info",
      title: "Info",
      message: "Log only",
      severity: "info",
    },
  };
  return map[id] ?? map.warning;
}

export const usePlaybookStore = create<PlaybookState>()(
  persist(
    (set, get) => ({
      playbooks: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addPlaybook: (playbook) => {
        const id = crypto.randomUUID();
        set((s) => ({
          playbooks: [...s.playbooks, { ...playbook, id }],
        }));
        return id;
      },
      updatePlaybook: (id, patch) => {
        set((s) => ({
          playbooks: s.playbooks.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        }));

        const contentChanged =
          "actionItems" in patch ||
          "guidance" in patch ||
          "alert" in patch ||
          "name" in patch;

        if (!contentChanged) return;

        const updated = get().playbooks.find((p) => p.id === id);
        if (!updated) return;

        void import("@/stores/alert-history-store").then(
          ({ useAlertHistoryStore }) => {
            useAlertHistoryStore
              .getState()
              .syncPlaybookContentToAlerts(updated);
          },
        );

        if (isLabGatedMockPlaybook(updated)) {
          void import("@/lib/mock-playbook-alerts").then(
            ({ syncMockPlaybookAlerts, isMockPlaybook }) => {
              if (isMockPlaybook(updated)) {
                void syncMockPlaybookAlerts(updated);
              }
            },
          );
        }
      },
      deletePlaybook: (id) =>
        set((s) => ({
          playbooks: s.playbooks.filter((p) => p.id !== id),
        })),
      toggleStatus: (id) => {
        let updated: Playbook | undefined;
        set((s) => ({
          playbooks: s.playbooks.map((p) => {
            if (p.id !== id) return p;
            if (
              isLabGatedMockPlaybook(p) &&
              p.status !== "active" &&
              !isLabSheetReady()
            ) {
              return p;
            }
            updated = {
              ...p,
              status: p.status === "active" ? "disabled" : "active",
            };
            return updated;
          }),
        }));
        if (updated) {
          void import("@/lib/mock-playbook-alerts").then(
            ({ syncMockPlaybookAlerts }) => syncMockPlaybookAlerts(updated!),
          );
        }
      },
      markTriggered: (id, at) =>
        set((s) => ({
          playbooks: s.playbooks.map((p) =>
            p.id === id ? { ...p, lastTriggeredAt: at } : p,
          ),
        })),
    }),
    {
      name: "playbook-editor-playbooks",
      version: 10,
      skipHydration: true,
      partialize: (s) => ({ playbooks: s.playbooks }),
      migrate: (persisted: unknown, version: number) => {
        try {
          const raw = persisted as {
            playbooks?: LegacyPlaybook[];
            state?: { playbooks?: LegacyPlaybook[] };
          };
          const list = raw.playbooks ?? raw.state?.playbooks;
          if (!list || !Array.isArray(list)) {
            return { playbooks: [] };
          }
          let playbooks = list
            .map(migratePlaybook)
            .filter((p) => !isDemoPlaybook(p))
            .filter((p) => p.name !== "Surplus margin desk")
            .map((p) => ({
              ...p,
              alert: normalizePlaybookAlert(p.alert),
            }));

          if (version < 7) {
            playbooks = playbooks.map((p) => {
              if (
                p.builtinId === POTENTIAL_VS_TEMP_BUILTIN_ID &&
                !(p.conditionGroups?.length ?? 0)
              ) {
                const template = createPotentialVsTempPlaybook();
                return {
                  ...p,
                  conditions: template.conditions,
                  matchMode: template.matchMode,
                  conditionGroups: template.conditionGroups,
                  groupMatchMode: template.groupMatchMode,
                  actionItems: template.actionItems,
                  guidance: template.guidance,
                  alert: template.alert,
                };
              }
              return p;
            });
          }

          if (version < 8) {
            const teams = useSettingsStore.getState().teams;
            playbooks = playbooks.map((p) => {
              const legacy = p as typeof p & { alertCategory?: string };
              const { alertCategory: _drop, ...rest } = legacy;
              return {
                ...rest,
                teamId: rest.teamId ?? inferTeamIdFromPlaybook(rest, teams),
              };
            });
          }

          if (version < 9) {
            playbooks = playbooks.map((p) => ({
              ...p,
              alert: normalizePlaybookAlert(p.alert),
            }));
          }

          if (version < 10) {
            playbooks = playbooks.map((p) => ({
              ...p,
              teamIds: p.teamIds?.length
                ? p.teamIds
                : p.teamId
                  ? [p.teamId]
                  : undefined,
            }));
          }

          return { playbooks };
        } catch {
          return { playbooks: [] };
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state?.playbooks?.length) {
          usePlaybookStore.setState({
            playbooks: state.playbooks
              .filter((p) => !isDemoPlaybook(p))
              .filter((p) => p.name !== "Surplus margin desk")
              .map((p) => {
                const migrated = migratePlaybook(p as LegacyPlaybook);
                return {
                  ...migrated,
                  alert: normalizePlaybookAlert(migrated.alert),
                };
              }),
          });
        }
        usePlaybookStore.getState().setHasHydrated(true);
      },
    },
  ),
);
