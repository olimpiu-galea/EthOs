"use client";

import { useEffect, useRef } from "react";
import { useDcsStore } from "@/stores/dcs-store";
import { useEnabledTags } from "@/hooks/use-enabled-tags";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { evaluateConditions, conditionsPreview } from "@/lib/rule-evaluator";
import { playbookCooldownMs } from "@/lib/types";
import { toast, TOAST_DURATION_MS } from "@/components/ui/use-toast";

export function usePlaybookEvaluation() {
  const connected = useDcsStore((s) => s.connected);
  const tags = useEnabledTags();
  const buffers = useDcsStore((s) => s.buffers);
  const lastSync = useDcsStore((s) => s.lastSync);
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const markTriggered = usePlaybookStore((s) => s.markTriggered);
  const addLiveAlert = useAlertHistoryStore((s) => s.addLiveAlert);
  const cooldownRef = useRef<Record<string, number>>({});
  const lastSyncRef = useRef<number | null>(null);

  useEffect(() => {
    if (!connected || !lastSync || tags.length === 0) return;
    if (lastSyncRef.current === lastSync) return;
    lastSyncRef.current = lastSync;

    const now = Date.now();

    for (const pb of playbooks) {
      if (pb.status !== "active") continue;

      const lastCd = cooldownRef.current[pb.id] ?? 0;
      if (now - lastCd < playbookCooldownMs(pb)) continue;

      const fired = evaluateConditions(
        pb.conditions,
        pb.matchMode,
        tags,
        buffers,
        now,
      );
      if (!fired) continue;

      cooldownRef.current[pb.id] = now;
      markTriggered(pb.id, now);

      const summary = conditionsPreview(pb.conditions, pb.matchMode);
      addLiveAlert(pb, now, summary);

      toast({
        title: pb.alert.title,
        description: `${pb.name}: ${pb.alert.message}`,
        variant:
          pb.alert.severity === "critical" ? "destructive" : "default",
        duration: TOAST_DURATION_MS,
        href: "/agenda",
      });
    }
  }, [
    connected,
    tags,
    buffers,
    lastSync,
    playbooks,
    markTriggered,
    addLiveAlert,
  ]);
}
