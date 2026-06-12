"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEvent } from "@/lib/types";

type AuditState = {
  events: AuditEvent[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  log: (event: Omit<AuditEvent, "id" | "at"> & { at?: number }) => void;
  forAlert: (alertId: string) => AuditEvent[];
};

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      events: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      log: (event) =>
        set((s) => ({
          events: [
            ...s.events,
            {
              ...event,
              id: crypto.randomUUID(),
              at: event.at ?? Date.now(),
            },
          ].slice(-500),
        })),

      forAlert: (alertId) =>
        get().events
          .filter((e) => e.alertId === alertId)
          .sort((a, b) => a.at - b.at),
    }),
    {
      name: "playbook-editor-audit",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ events: s.events }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
