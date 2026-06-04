import { tagKey } from "@/lib/dcs-parser";
import type { DcsTagWithKey, Playbook, Rule } from "@/lib/types";

export function tagMatchesRule(
  tag: DcsTagWithKey,
  rule: Pick<Rule, "signalId" | "displayLabel">,
): boolean {
  if (rule.displayLabel) {
    return tag.id === rule.signalId && tag.displayLabel === rule.displayLabel;
  }
  return tag.id === rule.signalId;
}

/** Used in a playbook condition — cannot be deactivated */
export function isTagLockedInPlaybooks(
  tag: DcsTagWithKey,
  playbooks: Playbook[],
): boolean {
  for (const pb of playbooks) {
    for (const c of pb.conditions ?? []) {
      if (c.rule.signalId && tagMatchesRule(tag, c.rule)) return true;
    }
  }
  return false;
}

export function isTagEnabled(
  tag: DcsTagWithKey,
  inactiveTagKeys: string[],
  playbooks: Playbook[],
): boolean {
  if (isTagLockedInPlaybooks(tag, playbooks)) return true;
  return !inactiveTagKeys.includes(tagKey(tag));
}

export function filterEnabledTags(
  tags: DcsTagWithKey[],
  inactiveTagKeys: string[],
  playbooks: Playbook[],
): DcsTagWithKey[] {
  return tags.filter((t) => isTagEnabled(t, inactiveTagKeys, playbooks));
}

/** Re-enable tags when they are added to a playbook */
export function activateTagsForPlaybookConditions(
  conditions: Playbook["conditions"],
  tags: DcsTagWithKey[],
  setTagActive: (key: string, active: boolean) => void,
): void {
  for (const c of conditions ?? []) {
    if (!c.rule.signalId) continue;
    const tag = tags.find((t) => tagMatchesRule(t, c.rule));
    if (tag) setTagActive(tagKey(tag), true);
  }
}
