"use client";

import { useEffect } from "react";
import { useLabStore } from "@/stores/lab-store";
import { useSettingsStore } from "@/stores/settings-store";
import { applyLabGatedMockPlaybooksGate } from "@/lib/lab-gated-mock-playbooks-gate";

/** Keep mock playbooks and feeds in sync for the demo workspace. */
export function useLabGatedMockPlaybooksGate() {
  const labFeedEnabled = useSettingsStore((s) => s.companyFeeds.lab);
  const labConnected = useLabStore((s) => s.connected);

  useEffect(() => {
    void applyLabGatedMockPlaybooksGate();
  }, [labFeedEnabled, labConnected]);
}
