"use client";

import { useEffect } from "react";
import { useLabStore } from "@/stores/lab-store";
import { useSettingsStore } from "@/stores/settings-store";
import { applyLabGatedMockPlaybooksGate } from "@/lib/lab-gated-mock-playbooks-gate";

/** Keep lab-gated mock playbooks visible/active in sync with Lab Sheet. */
export function useLabGatedMockPlaybooksGate() {
  const labFeedEnabled = useSettingsStore((s) => s.companyFeeds.lab);
  const labConnected = useLabStore((s) => s.connected);

  useEffect(() => {
    void applyLabGatedMockPlaybooksGate();
  }, [labFeedEnabled, labConnected]);
}
