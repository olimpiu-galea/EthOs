/** Strict DCS template — exactly 9 fields from source */
export type DcsTag = {
  id: string;
  value: string | number | boolean;
  name: string;
  desc: string;
  category: string;
  fieldType: string;
  frequency: string;
  displayLabel: string;
  unit: string;
};

export type DcsTagWithKey = DcsTag & { _key: string };

export type ValuePoint = {
  value: number;
  timestamp: number;
};

export type ComparisonOperator = ">" | "<" | ">=" | "<=" | "==" | "!=";

export type Rule = {
  signalId: string;
  displayLabel?: string;
  operator: ComparisonOperator;
  threshold: number;
  duration?: { value: number; unit: "min" | "h" };
  aggregation?: "instant" | "avg" | "max" | "min";
};

/** One trigger condition (flat list — no groups) */
export type PlaybookCondition = {
  id: string;
  rule: Rule;
};

export type ConditionMatchMode = "all" | "any";

export type AlertSeverity = "critical" | "warning" | "info";

export type PlaybookAlert = {
  type: "predefined" | "custom";
  predefinedId?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
};

export type PlaybookStatus = "active" | "disabled";

export type Playbook = {
  id: string;
  name: string;
  description?: string;
  status: PlaybookStatus;
  /** When these conditions match → fire alert */
  conditions: PlaybookCondition[];
  matchMode: ConditionMatchMode;
  alert: PlaybookAlert;
  /** Gap between alerts; default 5 min if omitted */
  alertCooldownMs?: number;
  lastTriggeredAt?: number;
};

export const PREDEFINED_ALERTS = [
  {
    id: "critical",
    title: "Critical",
    message: "Operator action required",
    severity: "critical" as const,
  },
  {
    id: "warning",
    title: "Warning",
    message: "Investigate within 1 hour",
    severity: "warning" as const,
  },
  {
    id: "info",
    title: "Info",
    message: "Log only",
    severity: "info" as const,
  },
] as const;

/** Minimum gap between two alerts for the same playbook */
export const TRIGGER_COOLDOWN_MS = 5 * 60 * 1000;

export function playbookCooldownMs(playbook: Playbook): number {
  const ms = playbook.alertCooldownMs;
  if (typeof ms === "number" && ms >= 0) return ms;
  return TRIGGER_COOLDOWN_MS;
}

export type AlertAgendaStatus = "active" | "completed";

export type AlertAgendaItem = {
  id: string;
  playbookId: string;
  playbookName: string;
  alertTitle: string;
  alertMessage: string;
  severity: AlertSeverity;
  triggeredAt: number;
  status: AlertAgendaStatus;
  conditionsSummary: string;
};

/** @deprecated Legacy nested rules — used only for localStorage migration */
export type RuleNode =
  | { type: "condition"; rule: Rule }
  | { type: "group"; logic: "and" | "or"; children: RuleNode[] };

export type LegacyPlaybook = Playbook & {
  runRules?: RuleNode;
  triggerRules?: RuleNode;
};
