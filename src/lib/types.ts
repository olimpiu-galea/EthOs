export type UserRole =
  | "platform_admin"
  | "company_admin"
  | "supervisor"
  | "financial"
  | "operational"
  | "maintenance"
  | "qa_lab"
  | "procurement";

export type IndustryDomain =
  | "ethanol"
  | "healthcare"
  | "steel"
  | "food_beverage"
  | "water"
  | "pharma";

export type SignalSource = "dcs" | "lab" | "commodity" | "inventory";

export type Company = {
  id: string;
  name: string;
  domain: IndustryDomain;
  createdAt: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  createdAt: number;
};

export type PlaybookActionItem = {
  id: string;
  title: string;
  detail: string;
};

export type PlaybookGuidanceStep = {
  title: string;
  body: string;
};

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

export type DcsTagWithKey = DcsTag & {
  _key: string;
  source?: SignalSource;
};

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

/** AND/OR group of conditions — playbook matchMode applies between groups */
export type PlaybookConditionGroup = {
  id: string;
  /** Optional description (e.g. classification table row) */
  label?: string;
  /** How conditions inside this group combine — typically "all" (AND) */
  matchMode: ConditionMatchMode;
  conditions: PlaybookCondition[];
};

export type ConditionMatchMode = "all" | "any";

export type AlertSeverity = "critical" | "warning" | "info";

export type PlaybookAlert = {
  type: "predefined";
  predefinedId: string;
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
  /** Stable id for built-in playbooks (e.g. potential-vs-temp) */
  builtinId?: string;
  /** Flat conditions — used when conditionGroups is empty */
  conditions: PlaybookCondition[];
  matchMode: ConditionMatchMode;
  /** Grouped rules: OR/ANY between groups, AND within each group */
  conditionGroups?: PlaybookConditionGroup[];
  /** How rule groups combine; defaults to matchMode when omitted */
  groupMatchMode?: ConditionMatchMode;
  alert: PlaybookAlert;
  /** Team assigned on create — controls who sees alerts on Agenda */
  teamId?: string;
  /** Derived from team members */
  routedRoles?: UserRole[];
  actionItems: PlaybookActionItem[];
  guidance: PlaybookGuidanceStep[];
  /** Gap between alerts; default 5 min if omitted */
  alertCooldownMs?: number;
  lastTriggeredAt?: number;
  /** Last 7-day backtest hit count */
  backtestHits7d?: number;
  /** Premium catalog playbook */
  isPremium?: boolean;
  premiumPrice?: number;
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

export function alertTypeLabel(alert: PlaybookAlert): string {
  const preset = PREDEFINED_ALERTS.find((p) => p.id === alert.predefinedId);
  return preset?.title ?? alert.title;
}

export function criticalPlaybookAlert(
  message: string,
): PlaybookAlert {
  const preset = PREDEFINED_ALERTS.find((p) => p.id === "critical")!;
  return {
    type: "predefined",
    predefinedId: preset.id,
    title: preset.title,
    message,
    severity: preset.severity,
  };
}

/** Minimum gap between two alerts for the same playbook */
export const TRIGGER_COOLDOWN_MS = 5 * 60 * 1000;

export function playbookCooldownMs(playbook: Playbook): number {
  const ms = playbook.alertCooldownMs;
  if (typeof ms === "number" && ms >= 0) return ms;
  return TRIGGER_COOLDOWN_MS;
}

export type AlertAgendaStatus = "active" | "completed";

export type AlertLifecycle =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "false_alarm";

export const ALERT_DURATION_MS = 60 * 60 * 1000;

export const ESCALATION_THRESHOLD_MS = 30 * 60 * 1000;

export type BatchPhaseId =
  | "prep"
  | "fill"
  | "prop"
  | "ferm"
  | "cascade"
  | "drop"
  | "flush"
  | "cip";

export type BatchContext = {
  batchId: string;
  fermenter: string;
  phaseId: BatchPhaseId;
  phaseLabel: string;
  batchAgeH: number;
  projectedYield: string;
  labSamples: { label: string; value: string }[];
};

export type AlertAgendaItem = {
  id: string;
  playbookId: string;
  playbookName: string;
  alertTitle: string;
  alertMessage: string;
  severity: AlertSeverity;
  triggeredAt: number;
  durationMs: number;
  status: AlertAgendaStatus;
  lifecycle: AlertLifecycle;
  conditionsSummary: string;
  actionItems: PlaybookActionItem[];
  guidance: PlaybookGuidanceStep[];
  completedActionIds: string[];
  manuallyCompleted?: boolean;
  completedAt?: number;
  escalationLevel?: number;
  assignedRole?: UserRole;
  teamId?: string;
  routedRoles?: UserRole[];
  batchContext?: BatchContext;
  /** Pre-computed playbook alerts — keep historical timestamps */
  isMockAlert?: boolean;
  mockAlertKey?: string;
  comments?: AlertComment[];
};

export type AlertComment = {
  id: string;
  body: string;
  author: string;
  at: number;
};

export type PlaybookFeedbackRating = "helpful" | "noise" | "wrong_threshold";

export type PlaybookFeedback = {
  id: string;
  alertId: string;
  playbookId: string;
  rating: PlaybookFeedbackRating;
  at: number;
  actor: string;
};

export type AuditEvent = {
  id: string;
  alertId?: string;
  playbookId?: string;
  marginDecisionId?: string;
  reportId?: string;
  action: string;
  actor: string;
  at: number;
  note?: string;
};

export type MarginDecisionType = "sell" | "hold" | "hedge";

export type MarginDecision = {
  id: string;
  type: MarginDecisionType;
  actor: string;
  actorRole: UserRole;
  note?: string;
  loadoutApproved: boolean;
  routedTo: UserRole[];
  at: number;
  reportId?: string;
  agendaAlertId?: string;
  snapshot: {
    marginPerGal: number;
    surplusGal: number;
    contractCoveragePct: number;
    inventoryDays: number;
    marketSignal: "SELL" | "HOLD";
    hedgeActive: boolean;
  };
};

export type ReportTemplateId =
  | "dor"
  | "shift"
  | "batch"
  | "quality"
  | "downtime"
  | "weekly"
  | "financial"
  | "postmortem";

export type LinkedAlertSnapshot = {
  id: string;
  playbookName: string;
  alertTitle: string;
  alertMessage: string;
  severity: AlertSeverity;
  teamId?: string;
  teamName?: string;
  triggeredAt: number;
  status: AlertAgendaStatus;
  conditionsSummary: string;
};

export type CommoditySignalSnapshot = {
  tag: string;
  displayLabel: string;
  value: string | number | boolean;
  unit: string;
  capturedAt: number;
};

export type ReportDocument = {
  id: string;
  templateId: ReportTemplateId;
  title: string;
  createdAt: number;
  createdBy: string;
  /** Report author (defaults to createdBy) */
  author: string;
  authorRole?: UserRole;
  fields: Record<string, string>;
  linkedAlerts: LinkedAlertSnapshot[];
  /** Commodity feed values captured when the report was saved */
  commoditySnapshot?: CommoditySignalSnapshot[];
  /** @deprecated legacy plain-text body — migrated on read */
  content?: string;
  /** @deprecated use linkedAlerts */
  linkedAlertIds?: string[];
};

export type ReportTemplateConfig = {
  id: ReportTemplateId;
  enabled: boolean;
};

/** @deprecated Legacy nested rules — used only for localStorage migration */
export type RuleNode =
  | { type: "condition"; rule: Rule }
  | { type: "group"; logic: "and" | "or"; children: RuleNode[] };

export type LegacyPlaybook = Playbook & {
  runRules?: RuleNode;
  triggerRules?: RuleNode;
};
