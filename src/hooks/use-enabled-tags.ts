"use client";

import { useMemo } from "react";
import { filterEnabledTags } from "@/lib/tag-activation";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useTagActivationStore } from "@/stores/tag-activation-store";
import { useAllSignalTags } from "@/hooks/use-all-signal-tags";

export function useEnabledTags() {
  const tags = useAllSignalTags();
  const inactiveTagKeys = useTagActivationStore((s) => s.inactiveTagKeys);
  const playbooks = usePlaybookStore((s) => s.playbooks);

  return useMemo(
    () => filterEnabledTags(tags, inactiveTagKeys, playbooks),
    [tags, inactiveTagKeys, playbooks],
  );
}
