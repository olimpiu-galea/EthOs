"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InventoryLedgerItem = {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  location: string;
  notes: string;
  updatedAt: number;
};

const SEED: Omit<InventoryLedgerItem, "id" | "updatedAt">[] = [
  {
    name: "Corn",
    category: "Feedstock",
    sku: "MAT-CORN-01",
    quantity: 12500,
    unit: "bu",
    reorderLevel: 8000,
    location: "Bin TK-1310",
    notes: "Primary fermenter feed",
  },
  {
    name: "Alpha Amylase",
    category: "Enzyme",
    sku: "MAT-ALPHA-01",
    quantity: 88,
    unit: "gal",
    reorderLevel: 40,
    location: "Chemical room A",
    notes: "Liquefaction dosage",
  },
  {
    name: "Gluco Amylase",
    category: "Enzyme",
    sku: "MAT-GLUCO-01",
    quantity: 64,
    unit: "gal",
    reorderLevel: 30,
    location: "Chemical room A",
    notes: "Saccharification",
  },
  {
    name: "Yeast",
    category: "Biological",
    sku: "MAT-YEAST-01",
    quantity: 420,
    unit: "kg",
    reorderLevel: 200,
    location: "Cold storage",
    notes: "Active dry — propagate TK-3102",
  },
  {
    name: "DAP",
    category: "Nutrient",
    sku: "MAT-DAP-01",
    quantity: 24,
    unit: "bags",
    reorderLevel: 10,
    location: "Ferm additions",
    notes: "Fermenter nutrient",
  },
  {
    name: "Antibiotics",
    category: "Additive",
    sku: "MAT-ABX-01",
    quantity: 8,
    unit: "bags",
    reorderLevel: 4,
    location: "Ferm additions",
    notes: "Contamination control",
  },
  {
    name: "CIP Caustic",
    category: "CIP",
    sku: "MAT-CIP-01",
    quantity: 310,
    unit: "gal",
    reorderLevel: 150,
    location: "CIP supply",
    notes: "Tank wash cycle",
  },
  {
    name: "Backset",
    category: "Recycle",
    sku: "MAT-BACK-01",
    quantity: 42000,
    unit: "gal",
    reorderLevel: 20000,
    location: "Backset pool",
    notes: "Slurry ratio ~29%",
  },
];

function seedItems(): InventoryLedgerItem[] {
  const now = Date.now();
  return SEED.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    updatedAt: now,
  }));
}

type InventoryItemsState = {
  items: InventoryLedgerItem[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addItem: (
    input: Omit<InventoryLedgerItem, "id" | "updatedAt">,
  ) => string;
  updateItem: (
    id: string,
    patch: Partial<Omit<InventoryLedgerItem, "id">>,
  ) => void;
  replaceItem: (id: string, replacement: InventoryLedgerItem) => void;
  removeItem: (id: string) => void;
  resetToSeed: () => void;
};

export const useInventoryItemsStore = create<InventoryItemsState>()(
  persist(
    (set, get) => ({
      items: seedItems(),
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addItem: (input) => {
        const id = crypto.randomUUID();
        set((s) => ({
          items: [
            {
              ...input,
              id,
              updatedAt: Date.now(),
            },
            ...s.items,
          ],
        }));
        return id;
      },

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id
              ? { ...item, ...patch, updatedAt: Date.now() }
              : item,
          ),
        })),

      replaceItem: (id, replacement) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id
              ? { ...replacement, id, updatedAt: Date.now() }
              : item,
          ),
        })),

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((item) => item.id !== id),
        })),

      resetToSeed: () => set({ items: seedItems() }),
    }),
    {
      name: "signal-relay-inventory-items",
      skipHydration: true,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => () => {
        useInventoryItemsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
