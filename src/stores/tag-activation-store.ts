"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type TagActivationState = {
  inactiveTagKeys: string[];
  setTagActive: (key: string, active: boolean) => void;
};

export const useTagActivationStore = create<TagActivationState>()(
  persist(
    (set, get) => ({
      inactiveTagKeys: [],
      setTagActive: (key, active) => {
        const next = new Set(get().inactiveTagKeys);
        if (active) next.delete(key);
        else next.add(key);
        set({ inactiveTagKeys: [...next] });
      },
    }),
    { name: "playbook-editor-tag-activation" },
  ),
);
