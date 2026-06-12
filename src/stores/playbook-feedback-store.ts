"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaybookFeedback, PlaybookFeedbackRating } from "@/lib/types";

type FeedbackState = {
  items: PlaybookFeedback[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addFeedback: (data: {
    alertId: string;
    playbookId: string;
    rating: PlaybookFeedbackRating;
    actor: string;
  }) => void;
  statsForPlaybook: (playbookId: string) => Record<PlaybookFeedbackRating, number>;
  helpfulPercent: (playbookId: string) => number | null;
};

export const usePlaybookFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addFeedback: (data) =>
        set((s) => ({
          items: [
            ...s.items.filter((i) => i.alertId !== data.alertId),
            {
              id: crypto.randomUUID(),
              ...data,
              at: Date.now(),
            },
          ],
        })),

      statsForPlaybook: (playbookId) => {
        const items = get().items.filter((i) => i.playbookId === playbookId);
        return {
          helpful: items.filter((i) => i.rating === "helpful").length,
          noise: items.filter((i) => i.rating === "noise").length,
          wrong_threshold: items.filter((i) => i.rating === "wrong_threshold").length,
        };
      },

      helpfulPercent: (playbookId) => {
        const stats = get().statsForPlaybook(playbookId);
        const total = stats.helpful + stats.noise + stats.wrong_threshold;
        if (total === 0) return null;
        return Math.round((stats.helpful / total) * 100);
      },
    }),
    {
      name: "playbook-editor-feedback",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
