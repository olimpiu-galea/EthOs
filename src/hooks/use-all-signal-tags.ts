"use client";

import { useMemo } from "react";
import { useDcsStore } from "@/stores/dcs-store";
import { useLabStore } from "@/stores/lab-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { useInventoryStore } from "@/stores/inventory-store";
import type { DcsTagWithKey } from "@/lib/types";

export function useAllSignalTags(): DcsTagWithKey[] {
  const dcsTags = useDcsStore((s) => s.tags);
  const labTags = useLabStore((s) => s.tags);
  const commodityTags = useCommodityStore((s) => s.tags);
  const inventoryTags = useInventoryStore((s) => s.tags);

  return useMemo(() => {
    const merged = [
      ...dcsTags.map((t) => ({ ...t, source: "dcs" as const })),
      ...labTags,
      ...commodityTags,
      ...inventoryTags,
    ];
    return merged;
  }, [dcsTags, labTags, commodityTags, inventoryTags]);
}

export function useAnyIntegrationConnected(): boolean {
  const dcs = useDcsStore((s) => s.connected);
  const lab = useLabStore((s) => s.connected);
  const commodity = useCommodityStore((s) => s.connected);
  const inventory = useInventoryStore((s) => s.connected);
  return dcs || lab || commodity || inventory;
}

export function useCombinedLastSync(): number | null {
  const dcs = useDcsStore((s) => s.lastSync);
  const lab = useLabStore((s) => s.lastSync);
  const commodity = useCommodityStore((s) => s.lastSync);
  const inventory = useInventoryStore((s) => s.lastSync);
  const times = [dcs, lab, commodity, inventory].filter(
    (t): t is number => t != null,
  );
  if (times.length === 0) return null;
  return Math.max(...times);
}
