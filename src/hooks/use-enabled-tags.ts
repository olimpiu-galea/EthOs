"use client";

import { useMemo } from "react";
import { filterEnabledTags } from "@/lib/tag-activation";
import { useDcsStore } from "@/stores/dcs-store";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useTagActivationStore } from "@/stores/tag-activation-store";

export function useEnabledTags() {
  const tags = useDcsStore((s) => s.tags);
  const inactiveTagKeys = useTagActivationStore((s) => s.inactiveTagKeys);
  const playbooks = usePlaybookStore((s) => s.playbooks);

  return useMemo(
    () => filterEnabledTags(tags, inactiveTagKeys, playbooks),
    [tags, inactiveTagKeys, playbooks],
  );
}
