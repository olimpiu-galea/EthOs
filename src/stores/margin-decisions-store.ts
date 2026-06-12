"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarginDecision } from "@/lib/types";

type MarginDecisionsState = {
  decisions: MarginDecision[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addDecision: (decision: MarginDecision) => void;
  linkReport: (decisionId: string, reportId: string) => void;
  linkAgendaAlert: (decisionId: string, agendaAlertId: string) => void;
  recent: (limit?: number) => MarginDecision[];
};

export const useMarginDecisionsStore = create<MarginDecisionsState>()(
  persist(
    (set, get) => ({
      decisions: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addDecision: (decision) =>
        set((s) => ({
          decisions: [decision, ...s.decisions].slice(0, 100),
        })),

      linkReport: (decisionId, reportId) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId ? { ...d, reportId } : d,
          ),
        })),

      linkAgendaAlert: (decisionId, agendaAlertId) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId ? { ...d, agendaAlertId } : d,
          ),
        })),

      recent: (limit = 8) => get().decisions.slice(0, limit),
    }),
    {
      name: "signal-relay-margin-decisions",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ decisions: s.decisions }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
