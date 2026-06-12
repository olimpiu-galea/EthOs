import { useLabStore } from "@/stores/lab-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Playbook } from "@/lib/types";
import { ACETIC_BUILTIN_ID } from "@/lib/acetic-rules";
import { POTENTIAL_VS_TEMP_BUILTIN_ID } from "@/lib/potential-vs-temp-rules";

export const LAB_GATED_MOCK_BUILTIN_IDS = [
  POTENTIAL_VS_TEMP_BUILTIN_ID,
  ACETIC_BUILTIN_ID,
] as const;

/** Lab Sheet is enabled for the company and connected on Integrations. */
export function isLabSheetReady(): boolean {
  const { companyFeeds } = useSettingsStore.getState();
  if (!companyFeeds.lab) return false;
  return useLabStore.getState().connected;
}

export function isLabGatedMockPlaybook(
  playbook: Pick<Playbook, "builtinId">,
): boolean {
  return (
    playbook.builtinId != null &&
    (LAB_GATED_MOCK_BUILTIN_IDS as readonly string[]).includes(
      playbook.builtinId,
    )
  );
}

/** Shown on the Playbooks page only when its prerequisites are met. */
export function isPlaybookListed(playbook: Playbook): boolean {
  if (isLabGatedMockPlaybook(playbook)) {
    return isLabSheetReady();
  }
  return true;
}

export function isPlaybookEffectivelyActive(playbook: Playbook): boolean {
  if (playbook.status !== "active") return false;
  if (isLabGatedMockPlaybook(playbook)) {
    return isLabSheetReady();
  }
  return true;
}
