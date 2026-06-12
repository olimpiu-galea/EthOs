"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type PurchasedState = {
  purchasedIds: string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  purchase: (catalogId: string) => void;
  isPurchased: (catalogId: string) => boolean;
};

export const usePurchasedPlaybooksStore = create<PurchasedState>()(
  persist(
    (set, get) => ({
      purchasedIds: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      purchase: (catalogId) =>
        set((s) => ({
          purchasedIds: s.purchasedIds.includes(catalogId)
            ? s.purchasedIds
            : [...s.purchasedIds, catalogId],
        })),

      isPurchased: (catalogId) => get().purchasedIds.includes(catalogId),
    }),
    {
      name: "signal-relay-purchased-playbooks",
      version: 2,
      skipHydration: true,
      partialize: (s) => ({ purchasedIds: s.purchasedIds }),
      migrate: (persisted: unknown) => {
        const raw = persisted as { purchasedIds?: string[] };
        const ids = raw.purchasedIds ?? [];
        return {
          purchasedIds: ids.filter((id) => id !== "premium-margin-desk"),
        };
      },
      onRehydrateStorage: () => () => {
        usePurchasedPlaybooksStore.getState().setHasHydrated(true);
      },
    },
  ),
);
