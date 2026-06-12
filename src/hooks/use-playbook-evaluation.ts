"use client";

import { useEffect, useRef } from "react";
import { useDcsStore } from "@/stores/dcs-store";
import { useEnabledTags } from "@/hooks/use-enabled-tags";
import { useCombinedLastSync } from "@/hooks/use-all-signal-tags";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import {
  evaluatePlaybookConditions,
  conditionsPreviewForPlaybook,
} from "@/lib/rule-evaluator";
import { isMockPlaybook } from "@/lib/mock-playbook-alerts";
import { playbookCooldownMs } from "@/lib/types";
import { toast, TOAST_DURATION_MS } from "@/components/ui/use-toast";

export function usePlaybookEvaluation() {
  const tags = useEnabledTags();
  const buffers = useDcsStore((s) => s.buffers);
  const lastSync = useCombinedLastSync();
  const cooldownRef = useRef<Record<string, number>>({});
  const lastSyncRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastSync || tags.length === 0) return;
    if (lastSyncRef.current === lastSync) return;
    lastSyncRef.current = lastSync;

    const now = Date.now();
    const { playbooks, markTriggered } = usePlaybookStore.getState();
    const { addLiveAlert } = useAlertHistoryStore.getState();

    for (const pb of playbooks) {
      if (pb.status !== "active" || isMockPlaybook(pb)) continue;

      const lastCd = cooldownRef.current[pb.id] ?? 0;
      if (now - lastCd < playbookCooldownMs(pb)) continue;

      const fired = evaluatePlaybookConditions(pb, tags, buffers, now);
      if (!fired) continue;

      cooldownRef.current[pb.id] = now;
      markTriggered(pb.id, now);

      const summary = conditionsPreviewForPlaybook(pb);
      addLiveAlert(pb, now, summary);

      toast({
        title: pb.alert.title,
        description: `${pb.name}: ${pb.alert.message}`,
        variant: pb.alert.severity === "critical" ? "destructive" : "default",
        duration: TOAST_DURATION_MS,
        href: "/agenda",
      });
    }
  }, [tags, buffers, lastSync]);
}
