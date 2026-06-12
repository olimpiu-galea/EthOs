import { canonicalSignalLabel, inferSignalSource } from "@/lib/ferm-signals";
import type { DcsTagWithKey, Rule, SignalSource } from "@/lib/types";

export const SOURCE_OPTIONS: { id: SignalSource; label: string }[] = [
  { id: "dcs", label: "DCS" },
  { id: "lab", label: "Lab Sheet" },
  { id: "commodity", label: "Commodity" },
  { id: "inventory", label: "Inventory" },
];

function placeholderTag(
  rule: Rule,
  source: SignalSource,
): DcsTagWithKey {
  const label = canonicalSignalLabel(rule);
  return {
    id: rule.signalId,
    value: rule.threshold,
    name: rule.signalId,
    desc: "",
    category: "FermData",
    fieldType: "analog",
    frequency: "batch",
    displayLabel: label,
    unit: "",
    _key: `${rule.signalId}::${label}`,
    source,
  };
}

export function uniqueTagsById(tags: DcsTagWithKey[]): DcsTagWithKey[] {
  const seen = new Set<string>();
  return tags.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

export function tagsForSource(
  allTags: DcsTagWithKey[],
  rule: Rule,
  source: SignalSource,
): DcsTagWithKey[] {
  const sourceTags = allTags.filter((t) => (t.source ?? "dcs") === source);
  if (!rule.signalId) return uniqueTagsById(sourceTags);
  const exists = sourceTags.some((t) => t.id === rule.signalId);
  if (exists) return uniqueTagsById(sourceTags);
  return uniqueTagsById([...sourceTags, placeholderTag(rule, source)]);
}

export function availableSourcesForRules(
  tags: DcsTagWithKey[],
  rules: Rule[],
): { id: SignalSource; label: string }[] {
  const set = new Set<SignalSource>();
  for (const t of tags) {
    set.add(t.source ?? "dcs");
  }
  for (const r of rules) {
    if (r.signalId) set.add(inferSignalSource(r.signalId));
  }
  const options = SOURCE_OPTIONS.filter((s) => set.has(s.id));
  const hasFerm = tags.some((t) => t.id.startsWith("FERM-"));
  if (!hasFerm) return options;
  return [
    ...options.filter((s) => s.id === "lab"),
    ...options.filter((s) => s.id !== "lab"),
  ];
}

export function defaultSourceForTags(
  tags: DcsTagWithKey[],
  availableSources: { id: SignalSource; label: string }[],
): SignalSource {
  if (tags.some((t) => t.id.startsWith("FERM-"))) return "lab";
  return availableSources[0]?.id ?? "dcs";
}

export function sourceForRule(
  rule: Rule,
  tags: DcsTagWithKey[],
  sourcePick: SignalSource | undefined,
  availableSources: { id: SignalSource; label: string }[],
): SignalSource {
  if (sourcePick) return sourcePick;
  if (rule.signalId) {
    const tag = tags.find((t) => t.id === rule.signalId);
    if (tag?.source) return tag.source;
    return inferSignalSource(rule.signalId);
  }
  return defaultSourceForTags(tags, availableSources);
}
