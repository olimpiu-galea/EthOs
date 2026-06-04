"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyPlaybook, Playbook, PlaybookAlert } from "@/lib/types";
import { migratePlaybook } from "@/lib/playbook-migrate";
import { createEmptyCondition } from "@/lib/playbook-utils";
import { isDemoPlaybook } from "@/lib/demo-playbook";

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
      updatePlaybook: (id, patch) =>
        set((s) => ({
          playbooks: s.playbooks.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),
      deletePlaybook: (id) =>
        set((s) => ({
          playbooks: s.playbooks.filter((p) => p.id !== id),
        })),
      toggleStatus: (id) =>
        set((s) => ({
          playbooks: s.playbooks.map((p) => {
            if (p.id !== id || isDemoPlaybook(p)) return p;
            return {
              ...p,
              status: p.status === "active" ? "disabled" : "active",
            };
          }),
        })),
      markTriggered: (id, at) =>
        set((s) => ({
          playbooks: s.playbooks.map((p) =>
            p.id === id ? { ...p, lastTriggeredAt: at } : p,
          ),
        })),
    }),
    {
      name: "playbook-editor-playbooks",
      version: 3,
      skipHydration: true,
      partialize: (s) => ({ playbooks: s.playbooks }),
      migrate: (persisted: unknown) => {
        try {
          const raw = persisted as {
            playbooks?: LegacyPlaybook[];
            state?: { playbooks?: LegacyPlaybook[] };
          };
          const list = raw.playbooks ?? raw.state?.playbooks;
          if (!list || !Array.isArray(list)) {
            return { playbooks: [] };
          }
          return {
            playbooks: list.map(migratePlaybook),
          };
        } catch {
          return { playbooks: [] };
        }
      },
      onRehydrateStorage: () => () => {
        usePlaybookStore.getState().setHasHydrated(true);
      },
    },
  ),
);
