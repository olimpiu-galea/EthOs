"use client";

import { create } from "zustand";
import { parseDcsCsv, numericValue } from "@/lib/dcs-parser";
import type { DcsTagWithKey } from "@/lib/types";

const REFRESH_MS = 60_000;

type CommodityState = {
  connected: boolean;
  tags: DcsTagWithKey[];
  lastSync: number | null;
  error: string | null;
  loading: boolean;
  refreshTimer: ReturnType<typeof setInterval> | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshValues: () => void;
};

function jitter(tag: DcsTagWithKey): number {
  const base = numericValue(tag.value);
  const span = Math.max(Math.abs(base) * 0.03, 0.01);
  return Math.round((base + (Math.random() - 0.5) * span) * 100) / 100;
}

export const useCommodityStore = create<CommodityState>((set, get) => ({
  connected: false,
  tags: [],
  lastSync: null,
  error: null,
  loading: false,
  refreshTimer: null,

  connect: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/fixtures/commodity-margin.csv");
      if (!res.ok) throw new Error("Failed to load commodity feed.");
      const text = await res.text();
      const tags = parseDcsCsv(text).map((t) => ({
        ...t,
        source: "commodity" as const,
      }));

      const existing = get().refreshTimer;
      if (existing) clearInterval(existing);
      const timer = setInterval(() => get().refreshValues(), REFRESH_MS);

      set({
        connected: true,
        tags,
        lastSync: Date.now(),
        loading: false,
        refreshTimer: timer,
      });

    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Connection failed",
        connected: false,
      });
    }
  },

  disconnect: () => {
    const timer = get().refreshTimer;
    if (timer) clearInterval(timer);
    set({
      connected: false,
      tags: [],
      lastSync: null,
      error: null,
      refreshTimer: null,
    });
  },

  refreshValues: () => {
    const { connected, tags } = get();
    if (!connected) return;
    set({
      tags: tags.map((t) => {
        const isDigital =
          t.fieldType.toLowerCase().includes("digital") ||
          t.displayLabel.includes("Signal") ||
          t.displayLabel.includes("Recommendation");
        if (isDigital) {
          return {
            ...t,
            value: Math.random() > 0.85 ? (numericValue(t.value) === 1 ? 0 : 1) : t.value,
          };
        }
        return { ...t, value: jitter(t) };
      }),
      lastSync: Date.now(),
    });
  },
}));
